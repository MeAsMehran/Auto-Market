import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, ArrowLeft, User, MessageCircle, AlertCircle, X, Check, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '../components/AnimatedPage';
import { listConversations, deleteConversation, getConversation, listMessages, sendMessage, markMessagesAsRead } from '../lib/chatApi';
import { useAuth } from '../context/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

const MAX_MESSAGES = 1000;

const capMessages = (messages) =>
  messages.length > MAX_MESSAGES ? messages.slice(messages.length - MAX_MESSAGES) : messages;

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type] || 'bg-gray-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className={`fixed bottom-4 right-4 z-50 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm`}
    >
      {type === 'success' && <Check className="w-5 h-5" />}
      {type === 'error' && <AlertCircle className="w-5 h-5" />}
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default function Chat() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const conversationsLoadedRef = useRef(false);
  const wsConversationIdRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const lastSeenMessageIdRef = useRef(null);
  const pendingMessagesRef = useRef({});
  const wsMountedRef = useRef(true);
  const activeChatIdRef = useRef(null);
  const pendingAutoScrollRef = useRef(false);
  const messagesCountRef = useRef(0);
  const sentTimeoutsRef = useRef({});
  const retryTimeoutsRef = useRef({});

  useEffect(() => {
    messagesCountRef.current = messages.length;
  }, [messages.length]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const markMessageFailed = useCallback((clientId, retryAfter = null) => {
    clearTimeout(sentTimeoutsRef.current[clientId]);
    delete sentTimeoutsRef.current[clientId];

    setMessages((prev) =>
      prev.map((m) =>
        m.clientId === clientId ? { ...m, status: 'failed', retryAfter } : m
      )
    );
  }, []);

  const deleteMessage = useCallback((clientId) => {
    clearTimeout(sentTimeoutsRef.current[clientId]);
    clearTimeout(retryTimeoutsRef.current[clientId]);
    delete sentTimeoutsRef.current[clientId];
    delete retryTimeoutsRef.current[clientId];
    delete pendingMessagesRef.current[clientId];
    setMessages((prev) => prev.filter((m) => m.clientId !== clientId));
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    });
  }, []);

  const scrollToBottomForce = useCallback((smooth = true) => {
    setHasNewMessage(false);
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
      setIsAtBottom(true);
    });
  }, []);

  const loadMoreMessagesRef = useRef(null);

  const loadMoreMessages = useCallback(async () => {
    if (loadMoreMessagesRef.current) return;
    loadMoreMessagesRef.current = true;

    const chatId = selectedChat;

    try {
      setLoadingMore(true);

      const container = messagesContainerRef.current;
      if (!container) return;

      if (messagesCountRef.current >= MAX_MESSAGES) {
        setHasMore(false);
        setNextCursor(null);
        return;
      }

      const oldScrollHeight = container.scrollHeight;
      const oldScrollTop = container.scrollTop;

      const msgsData = await listMessages(chatId, nextCursor);

      if (activeChatIdRef.current !== chatId) return;

      const msgs = msgsData.messages || [];
      if (msgs.length === 0) {
        setHasMore(false);
        return;
      }

      const normalizedMessages = msgs.map((m) => ({
        id: m.id,
        content: m.message_text || m.content || '',
        sender: { id: m.sender_id, name: m.sender_name },
        status: m.status || 'sent',
        created_at: m.created_at,
      }));

      pendingAutoScrollRef.current = false;
      setMessages((prev) => capMessages([...normalizedMessages, ...prev]));
      setNextCursor(msgsData.next_cursor || null);
      setHasMore(msgsData.has_next || false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            const heightAdded = newScrollHeight - oldScrollHeight;
            container.scrollTop = oldScrollTop + heightAdded;
          }
        });
      });
    } catch (err) {
      console.error('Failed to load more messages:', err);
      showToast('خطا در بارگذاری پیام‌های قدیمی‌تر', 'error');
    } finally {
      setLoadingMore(false);
      loadMoreMessagesRef.current = null;
    }
  }, [hasMore, loadingMore, nextCursor, selectedChat, showToast]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 150;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;
    const isNearTop = scrollTop < threshold;

    setIsAtBottom(isNearBottom);

    if (isNearBottom) {
      setHasNewMessage(false);
      const messages = container.querySelectorAll('[data-message-id]');
      if (messages && messages.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
        const lastMsg = messages[messages.length - 1];
        const lastId = parseInt(lastMsg.dataset.messageId);
        if (lastId && lastId !== lastSeenMessageIdRef.current) {
          lastSeenMessageIdRef.current = lastId;
          wsRef.current.send(JSON.stringify({ type: 'messages_seen', last_seen_message_id: lastId }));
        }
      }
    }

    if (isNearTop && hasMore && !loadingMore && nextCursor && loadMoreMessages) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, nextCursor, loadMoreMessages]);

  const sendTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing_stop' }));
    }
  }, []);

  const handleTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing_start' }));
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, 3000);
  }, [sendTypingStop]);

  const connectWebSocket = useCallback((conversationId) => {
    const token = localStorage.getItem('access_token');
    if (!token || !conversationId) return;

    if (!wsMountedRef.current) return;

    if (wsConversationIdRef.current === conversationId && wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    wsConversationIdRef.current = conversationId;
    setWsStatus('connecting');
    const ws = new WebSocket(`${WS_URL}/ws/chat/${conversationId}/?token=${token}`);
    let pingInterval = null;

    ws.onopen = () => {
      if (!wsMountedRef.current) {
        ws.close();
        return;
      }
      setWsStatus('connected');
      reconnectAttemptsRef.current = 0;
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 60000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'error') {
          let errorMessage = data.message || 'خطایی رخ داد';
          if (data.code === 'rate_limit_exceeded' && data.retry_after) {
            const seconds = data.retry_after;
            errorMessage = `ظرفیت ارسال پیام تمام شد. ${seconds} ثانیه صبر کنید.`;
          }
          showToast(errorMessage, 'error');
          if (data.client_message_id) {
            const retryAfter = data.retry_after || null;
            markMessageFailed(data.client_message_id, retryAfter);
            if (retryAfter && retryAfter > 0) {
              if (retryTimeoutsRef.current[data.client_message_id]) {
                clearTimeout(retryTimeoutsRef.current[data.client_message_id]);
              }
              retryTimeoutsRef.current[data.client_message_id] = setTimeout(
                () => retryMessage(data.client_message_id),
                retryAfter * 1000
              );
            }
          }
          return;
        }

        if (data.type === 'new_message' && data.message) {
          const msg = data.message;
          const newMsg = {
            id: msg.id,
            content: msg.text,
            sender: { id: msg.sender_id, name: msg.sender_name },
            status: msg.status || 'sent',
            created_at: msg.created_at,
          };

          const isOwnMessage = msg.sender_id === user?.id;
          const clientMsgId = msg.client_message_id;

          setMessages((prev) => {
            if (clientMsgId && prev.some((m) => m.clientId === clientMsgId)) {
              return prev.map((m) =>
                m.clientId === clientMsgId ? { ...m, ...newMsg, status: msg.status } : m
              );
            }
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return capMessages([...prev, newMsg]);
          });

          if (clientMsgId) {
            delete pendingMessagesRef.current[clientMsgId];
            clearTimeout(sentTimeoutsRef.current[clientMsgId]);
            delete sentTimeoutsRef.current[clientMsgId];
            clearTimeout(retryTimeoutsRef.current[clientMsgId]);
            delete retryTimeoutsRef.current[clientMsgId];
          }

          if (!isOwnMessage) {
            ws.send(JSON.stringify({ type: 'message_delivered', message_id: msg.id }));
          }

          if (isOwnMessage || isAtBottom) {
            scrollToBottom();
          } else {
            setHasNewMessage(true);
          }
        }

        if (data.type === 'conversation_updated' && data.conversation) {
          const updatedConv = data.conversation;
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === updatedConv.id);
            let updated;
            if (exists) {
              updated = prev.map((conv) => {
                if (conv.id === updatedConv.id) {
                  const isOwnMessage = user?.id === updatedConv.last_message?.sender_id;
                  const newUnreadCount = isOwnMessage ? 0 : (updatedConv.unread_count ?? 0);
                  return {
                    ...conv,
                    last_message: updatedConv.last_message,
                    updated_at: updatedConv.updated_at,
                    unread_count: updatedConv.id === conversationId ? 0 : newUnreadCount,
                  };
                }
                return conv;
              });
            } else {
              getConversation(updatedConv.id).then((fullConv) => {
                if (fullConv && !conversations.some((c) => c.id === fullConv.id)) {
                  setConversations((prevConv) => {
                    const newList = [...(prevConv || []), fullConv];
                    return newList.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
                  });
                }
              });
              updated = prev;
            }
            return updated.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
          });
        }

        if (data.type === 'status_update') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.message_id ? { ...m, status: data.status } : m
            )
          );
        }

        if (data.type === 'messages_seen_update') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id <= data.last_seen_id && m.sender?.id !== user?.id
                ? { ...m, status: 'seen' } : m
            )
          );

          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === conversationId) {
                return { ...conv, unread_count: 0 };
              }
              return conv;
            })
          );
        }

        if (data.type === 'typing_update') {
          setTypingUsers((prev) => ({
            ...prev,
            [data.user_id]: data.is_typing,
          }));
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onclose = (event) => {
      if (pingInterval) clearInterval(pingInterval);
      setWsStatus('disconnected');
      if (event.code !== 1000 && event.code !== 1006 && reconnectAttemptsRef.current < 3) {
        reconnectAttemptsRef.current++;
        setTimeout(() => connectWebSocket(conversationId), 1000 * reconnectAttemptsRef.current);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('error');
    };

    wsRef.current = ws;
  }, [scrollToBottom, user, isAtBottom, markMessageFailed]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    wsConversationIdRef.current = null;
    reconnectAttemptsRef.current = 0;
  }, []);

  const connectWebSocketRef = useRef(connectWebSocket);
  const disconnectWebSocketRef = useRef(disconnectWebSocket);

  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
    disconnectWebSocketRef.current = disconnectWebSocket;
  });

  const loadConversations = useCallback(async () => {
    if (conversationsLoadedRef.current) return;
    conversationsLoadedRef.current = true;

    try {
      const data = await listConversations();
      const convs = Array.isArray(data) ? data : [];
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      showToast('خطا در بارگذاری گفتگوها', 'error');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, user]);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      activeChatIdRef.current = conversationId;
      setLoadingMessages(true);
      setMessages([]);
      setHasNewMessage(false);
      setIsAtBottom(true);
      setNextCursor(null);
      setHasMore(true);
      lastMessageCountRef.current = 0;

      const [conversation, msgsData] = await Promise.all([
        getConversation(conversationId),
        listMessages(conversationId),
      ]);

      setActiveConversation(conversation);

      const msgs = msgsData.messages || [];
      const normalizedMessages = msgs.map((m) => ({
        id: m.id,
        content: m.message_text || m.content || '',
        sender: { id: m.sender_id, name: m.sender_name },
        status: m.status || 'sent',
        created_at: m.created_at,
      }));

      pendingAutoScrollRef.current = true;
      setMessages(capMessages(normalizedMessages));
      setNextCursor(msgsData.next_cursor || null);
      setHasMore(msgsData.has_next || false);
      lastMessageCountRef.current = normalizedMessages.length;
      lastSeenMessageIdRef.current = null;
      prevScrollHeightRef.current = 0;

      try {
        await markMessagesAsRead(conversationId);
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
          )
        );
      } catch (e) {
        console.error('Failed to mark messages as read:', e);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      showToast('خطا در بارگذاری پیام‌ها', 'error');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (conversationsLoadedRef.current) return;
    loadConversations();
  }, [loadConversations]);

  const connectedChatRef = useRef(null);

  useEffect(() => {
    if (!selectedChat) {
      disconnectWebSocketRef.current?.();
      setActiveConversation(null);
      setMessages([]);
      connectedChatRef.current = null;
      return;
    }

    if (connectedChatRef.current === selectedChat) {
      return;
    }

    connectedChatRef.current = selectedChat;
    loadMessages(selectedChat);
    connectWebSocketRef.current?.(selectedChat);

    return () => disconnectWebSocketRef.current?.();
  }, [selectedChat, loadMessages]);



  useEffect(() => {
    const handleBeforeUnload = () => {
      if (wsRef.current) {
        wsRef.current.close(1000);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!user) {
      disconnectWebSocket();
    }
  }, [user, disconnectWebSocket]);

  useLayoutEffect(() => {
    if (!pendingAutoScrollRef.current) return;
    if (!selectedChat || messages.length === 0 || loadingMore || loadingMessages) return;

    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }

    pendingAutoScrollRef.current = false;
  }, [selectedChat, messages.length, loadingMore, loadingMessages]);

  useEffect(() => {
    if (selectedChat && messages.length > 0 && !loadingMore && !loadingMessages) {
      const messages = messagesContainerRef.current?.querySelectorAll('[data-message-id]');
      if (messages && messages.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
        const lastMsg = messages[messages.length - 1];
        const lastId = parseInt(lastMsg.dataset.messageId);
        if (lastId && lastId !== lastSeenMessageIdRef.current) {
          lastSeenMessageIdRef.current = lastId;
          wsRef.current.send(JSON.stringify({ type: 'messages_seen', last_seen_message_id: lastId }));
        }
      }
    }
  }, [selectedChat, messages.length, loadingMore, loadingMessages]);

  const submitMessage = async (messageText, retryClientId = null) => {
    if (!messageText.trim() || !selectedChat) return;

    const clientId = retryClientId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!retryClientId) {
      setSending(true);
    }
    sendTypingStop();

    if (!retryClientId) {
      const tempMsg = {
        id: clientId,
        clientId: clientId,
        content: messageText,
        sender: user,
        status: 'sending',
        created_at: new Date().toISOString(),
        sentAt: Date.now(),
      };
      setMessages((prev) => capMessages([...prev, tempMsg]));
      scrollToBottom();
    }

    pendingMessagesRef.current[clientId] = messageText;

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({
            type: 'message',
            message_text: messageText,
            client_message_id: clientId
          }));

          if (sentTimeoutsRef.current[clientId]) {
            clearTimeout(sentTimeoutsRef.current[clientId]);
          }
          sentTimeoutsRef.current[clientId] = setTimeout(() => {
            markMessageFailed(clientId, null);
          }, 10000);

          scrollToBottom();
          return;
        } catch (wsErr) {
          console.error('WebSocket send failed:', wsErr);
        }
      }

      const savedMessage = await sendMessage(selectedChat, messageText);
      const normalizedMsg = {
        id: savedMessage.id,
        clientId: clientId,
        content: savedMessage.message_text || savedMessage.content,
        sender: savedMessage.sender_user,
        status: savedMessage.status || 'sent',
        created_at: savedMessage.created_at,
      };

      setMessages((prev) => {
        return prev.map((m) =>
          m.clientId === clientId ? normalizedMsg : m
        );
      });

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === selectedChat) {
            return {
              ...conv,
              last_message: {
                id: savedMessage.id,
                message_text: savedMessage.message_text || messageText,
                created_at: savedMessage.created_at,
              },
              updated_at: new Date().toISOString(),
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      );

      delete pendingMessagesRef.current[clientId];
      clearTimeout(sentTimeoutsRef.current[clientId]);
      delete sentTimeoutsRef.current[clientId];
      clearTimeout(retryTimeoutsRef.current[clientId]);
      delete retryTimeoutsRef.current[clientId];
      scrollToBottom();
    } catch (err) {
      console.error('Send error:', err);
      markMessageFailed(clientId, null);
      pendingMessagesRef.current[clientId] = messageText;
    } finally {
      setSending(false);
    }
  };

  const retryMessage = async (clientId) => {
    const messageText = pendingMessagesRef.current[clientId];
    if (!messageText) return;

    if (retryTimeoutsRef.current[clientId]) {
      clearTimeout(retryTimeoutsRef.current[clientId]);
      delete retryTimeoutsRef.current[clientId];
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.clientId === clientId ? { ...m, status: 'sending', sentAt: Date.now() } : m
      )
    );

    await submitMessage(messageText, clientId);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;
    setNewMessage('');
    await submitMessage(text);
  };

  const handleDelete = async (e, conversationId) => {
    e.stopPropagation();
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید این گفتگو را حذف کنید؟')) return;

    try {
      await deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      if (selectedChat === conversationId) {
        setSelectedChat(null);
        disconnectWebSocket();
      }

      showToast('گفتگو حذف شد', 'success');
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      showToast('خطا در حذف گفتگو', 'error');
    }
  };

  const handleSelectChat = (conversation) => {
    setSelectedChat(conversation.id);
    setShowMobileList(false);
  };

  const handleBack = () => {
    setShowMobileList(true);
    setSelectedChat(null);
  };

  const getOtherUser = (conversation) => {
    const seller = { id: conversation.seller_id, name: conversation.seller_name };
    const buyer = { id: conversation.buyer_id, name: conversation.buyer_name };

    if (!user) {
      return { id: null, name: 'کاربر' };
    }

    let otherUserId;
    let otherUserName;

    if (seller.id === user.id) {
      otherUserId = buyer?.id;
      otherUserName = buyer?.name || 'کاربر';
    } else {
      otherUserId = seller?.id;
      otherUserName = seller?.name || 'کاربر';
    }

    return {
      id: otherUserId,
      name: otherUserName,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'امروز';
    if (days === 1) return 'دیروز';
    if (days < 7) return `${days} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedChat(parseInt(conversationId));
      setShowMobileList(false);
    }
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-surface rounded-2xl border border-border overflow-hidden h-[calc(100vh-12rem)] min-h-[500px] flex"
      >
        <div className={`w-full sm:w-80 border-l border-border flex flex-col ${!showMobileList && 'hidden sm:flex'}`}>
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-text-primary text-lg">پیام‌ها</h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex-1 overflow-y-auto"
          >
            {!user || loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                <p className="text-sm text-text-tertiary">هنوز گفتگویی ندارید</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherUser = getOtherUser(conv);
                const lastMessage = conv.last_message;
                return (
                  <motion.button
                    key={conv.id}
                    variants={fadeUpItem}
                    whileHover={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => handleSelectChat(conv)}
                    className={`w-full flex items-start gap-3 p-4 hover:bg-surface-secondary transition-all border-b border-border-light text-right will-change-transform ${
                      selectedChat === conv.id ? 'bg-brand-50 dark:bg-brand-950/30 ring-1 ring-brand-500/20' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-lg">
                          {otherUser.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-text-primary text-sm truncate">
                          {otherUser.name}
                        </h3>
                        <span className="text-xs text-text-tertiary shrink-0">
                          {formatDate(conv.updated_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 truncate">
                        <span className="font-medium truncate">{conv.car_ad_brand}</span>
                      </div>

                      <p className="text-xs text-text-secondary truncate font-medium">
                        {conv.car_ad_title}
                      </p>

                      {lastMessage && (
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-text-tertiary truncate flex-1">
                            {lastMessage.message_text}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="bg-brand-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                              {conv.unread_count > 99 ? '99+' : conv.unread_count}
                            </span>
                          )}
                          <span className="text-[10px] text-text-tertiary shrink-0">
                            {formatTime(lastMessage.created_at)}
                          </span>
                        </div>
                      )}

                      {!lastMessage && (
                        <p className="text-xs text-text-tertiary italic">
                          هنوز پیامی ارسال نشده
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })
            )}
          </motion.div>
        </div>

        {selectedChat && activeConversation ? (
          <div className={`flex-1 flex flex-col ${showMobileList && 'hidden sm:flex'}`}>
            <div className="flex items-center gap-3 p-4 border-b border-border bg-surface">
              <button onClick={handleBack} className="sm:hidden p-1 hover:bg-surface-tertiary rounded-lg">
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary text-sm">
                  {activeConversation.car_ad_title}
                </h3>
                <p className="text-xs text-text-tertiary flex items-center gap-1">
                  {activeConversation && (() => {
                    const otherUserId = user?.id === activeConversation.seller_id
                      ? activeConversation.buyer_id
                      : activeConversation.seller_id;
                    const isTyping = typingUsers[otherUserId];
                    if (isTyping) {
                      return (
                        <span className="text-blue-500 flex items-center gap-1">
                          <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                          </span>
                          در حال تایپ...
                        </span>
                      );
                    }
                    return null;
                  })()}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, selectedChat)}
                className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                title="حذف گفتگو"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 bg-surface-secondary"
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                  پیامی وجود ندارد. گفتگو را شروع کنید!
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-2"
                >
                  {loadingMore && (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                    </div>
                  )}
                  {!hasMore && messages.length > 0 && (
                    <div className="text-center py-2 text-xs text-text-tertiary">
                      قدیمی‌ترین پیام‌ها
                    </div>
                  )}
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender?.id === user?.id;
                    const prevMsg = messages[index - 1];
                    const showDate = !prevMsg ||
                      new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

                    return (
                      <motion.div key={msg.id} variants={fadeUpItem} data-message-id={msg.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-xs text-text-tertiary bg-surface px-3 py-1 rounded-full">
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-start' : 'justify-end'} mb-1`}>
                          <div
                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                              isOwn
                                ? msg.status === 'failed'
                                  ? 'bg-red-500/20 text-red-700 dark:text-red-300 rounded-bl-sm'
                                  : 'bg-brand-500 text-white rounded-bl-md rounded-br-sm'
                                : 'bg-surface border border-border text-text-primary rounded-br-md rounded-bl-sm'
                            }`}
                          >
                            {isOwn && msg.status === 'failed' && (
                              <p className="text-[10px] font-bold text-red-500 mb-1">ارسال نشد</p>
                            )}
                            <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-start' : 'justify-end'}`}>
                              <span className={`text-[10px] ${isOwn ? (msg.status === 'failed' ? 'text-red-700/70 dark:text-red-300/70' : 'text-white/70') : 'text-text-tertiary'}`}>
                                {formatTime(msg.created_at)}
                              </span>
                              {isOwn && msg.status !== 'sending' && msg.status !== 'failed' && (
                                <span className="text-white/70">
                                  {msg.status === 'seen' ? (
                                    <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : msg.status === 'delivered' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </span>
                              )}
                              {isOwn && msg.status === 'sending' && (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                              {isOwn && msg.status === 'failed' && (
                                <>
                                  <button
                                    onClick={() => retryMessage(msg.clientId)}
                                    disabled={msg.retryAfter && msg.retryAfter > 0}
                                    className={`flex items-center gap-1 text-red-300 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={msg.retryAfter ? `${msg.retryAfter}s تا امکان ارسال مجدد` : 'تلاش مجدد'}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="text-[10px]">{msg.retryAfter ? `${msg.retryAfter}s` : 'تلاش مجدد'}</span>
                                  </button>
                                  <button
                                    onClick={() => deleteMessage(msg.clientId)}
                                    className="flex items-center gap-1 text-red-400 hover:text-red-300"
                                    title="حذف پیام"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="text-[10px]">حذف</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                  {hasNewMessage && !isAtBottom && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={scrollToBottomForce}
                      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-4 py-2 rounded-full text-sm shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      پیام جدید
                    </motion.button>
                  )}
                </motion.div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-border bg-surface">
              <div className="flex items-center gap-2 bg-surface-tertiary rounded-2xl px-4 py-2 border border-border focus-within:border-brand-500 transition-colors">
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const text = e.target.value.trim();
                      if (text) {
                        setNewMessage('');
                        submitMessage(text);
                        sendTypingStop();
                      }
                    }
                  }}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 bg-transparent text-sm focus:outline-none text-text-primary placeholder:text-text-tertiary resize-none min-h-[24px] max-h-[120px]"
                  disabled={sending}
                  rows={1}
                  style={{ height: 'auto', overflow: 'hidden' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-xl transition-colors shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center bg-surface-secondary">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <MessageCircle className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
              <p className="text-text-tertiary">یک گفتگو را انتخاب کنید</p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
