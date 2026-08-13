import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, ArrowLeft, User, MessageCircle, AlertCircle, X, Check, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '../components/AnimatedPage';
import { listConversations, deleteConversation, getConversation, listMessages, sendMessage, getUsersPresence } from '../lib/chatApi';
import { useAuth } from '../context/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

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
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [onlineUsers, setOnlineUsers] = useState({});

  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const conversationsLoadedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const wsConversationIdRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    });
  }, []);

  const connectWebSocket = useCallback((conversationId) => {
    const token = localStorage.getItem('access_token');
    if (!token || !conversationId) return;

    if (wsConversationIdRef.current === conversationId && wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    wsConversationIdRef.current = conversationId;
    setWsStatus('connecting');
    const ws = new WebSocket(`${WS_URL}/ws/chat/${conversationId}/?token=${token}`);

    ws.onopen = () => {
      setWsStatus('connected');
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'presence_update') {
          setOnlineUsers((prev) => ({
            ...prev,
            [data.user_id]: data.is_online,
          }));
          return;
        }

        if (data.type === 'new_message' && data.message) {
          const msg = data.message;
          const newMsg = {
            id: msg.id,
            content: msg.text,
            sender: { id: msg.sender_id, name: msg.sender_name },
            created_at: msg.created_at,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === conversationId) {
                return {
                  ...conv,
                  last_message: {
                    id: msg.id,
                    message_text: msg.text,
                    created_at: msg.created_at,
                  },
                  updated_at: new Date().toISOString(),
                };
              }
              return conv;
            }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          );

          scrollToBottom();
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onclose = (event) => {
      setWsStatus('disconnected');
      if (event.code !== 1000 && reconnectAttemptsRef.current < 3) {
        reconnectAttemptsRef.current++;
        setTimeout(() => connectWebSocket(conversationId), 1000 * reconnectAttemptsRef.current);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('error');
    };

    wsRef.current = ws;
  }, [scrollToBottom]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    wsConversationIdRef.current = null;
  }, []);

  const loadConversations = useCallback(async () => {
    if (conversationsLoadedRef.current) return;
    conversationsLoadedRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const data = await listConversations();
      const convs = Array.isArray(data) ? data : [];
      setConversations(convs);

      const userIdsSet = new Set(convs.map((c) => {
        if (user && c.seller?.id === user.id) return c.buyer?.id;
        return c.seller?.id;
      }).filter(Boolean));

      if (userIdsSet.size > 0) {
        try {
          const presenceData = await getUsersPresence([...userIdsSet]);
          setOnlineUsers(presenceData || {});
        } catch (e) {
          console.error('Failed to fetch presence:', e);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load conversations:', err);
      showToast('خطا در بارگذاری گفتگوها', 'error');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, user]);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      setLoadingMessages(true);
      setMessages([]);

      const [conversation, msgsData] = await Promise.all([
        getConversation(conversationId),
        listMessages(conversationId, 1),
      ]);

      setActiveConversation(conversation);

      const msgs = msgsData.messages || msgsData || [];
      const normalizedMessages = msgs.map((m) => ({
        id: m.id,
        content: m.message_text || m.content || '',
        sender: m.sender_user || m.sender || { id: m.sender_id, name: m.sender_name },
        created_at: m.created_at,
      }));

      setMessages(normalizedMessages);
      scrollToBottom(false);
    } catch (err) {
      console.error('Failed to load messages:', err);
      showToast('خطا در بارگذاری پیام‌ها', 'error');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [showToast, scrollToBottom]);

  useEffect(() => {
    let mounted = true;
    loadConversations().then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
      conversationsLoadedRef.current = false;
    };
  }, [loadConversations]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
      connectWebSocket(selectedChat);
    } else {
      disconnectWebSocket();
      setActiveConversation(null);
      setMessages([]);
    }

    return () => disconnectWebSocket();
  }, [selectedChat, loadMessages, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    if (!selectedChat || wsStatus !== 'connected') return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 60000);

    return () => clearInterval(pingInterval);
  }, [selectedChat, wsStatus]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ message_text: messageText }));
          scrollToBottom();
          return;
        } catch (wsErr) {
          console.error('WebSocket send failed:', wsErr);
        }
      }

      const savedMessage = await sendMessage(selectedChat, messageText);
      const normalizedMsg = {
        id: savedMessage.id,
        content: savedMessage.message_text || savedMessage.content,
        sender: savedMessage.sender_user,
        created_at: savedMessage.created_at,
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === normalizedMsg.id)) return prev;
        return [...prev, normalizedMsg];
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

      scrollToBottom();
    } catch (err) {
      console.error('Send error:', err);
      showToast('خطا در ارسال پیام', 'error');
    } finally {
      setSending(false);
    }
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
    const carAd = conversation.car_ad || {};
    const seller = carAd.seller || {};
    const buyer = conversation.buyer || {};

    if (!user) {
      return { id: null, name: 'کاربر', isOnline: false };
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
      isOnline: onlineUsers[otherUserId] || false,
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
                const carAd = conv.car_ad;
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
                      {otherUser.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-3 border-surface rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold text-text-primary text-sm truncate">
                            {otherUser.name}
                          </h3>
                          {otherUser.isOnline && (
                            <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-text-tertiary shrink-0">
                          {formatDate(conv.updated_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 truncate">
                        <span className="font-medium truncate">{carAd?.brand}</span>
                        <span className="text-text-tertiary">·</span>
                        <span className="truncate">{carAd?.model_name}</span>
                      </div>

                      <p className="text-xs text-text-secondary truncate font-medium">
                        {carAd?.title}
                      </p>

                      {lastMessage && (
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-text-tertiary truncate flex-1">
                            {lastMessage.message_text}
                          </p>
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
                {activeConversation && (() => {
                  const otherUserId = user?.id === activeConversation.seller?.id
                    ? activeConversation.buyer?.id
                    : activeConversation.seller?.id;
                  const isOtherOnline = onlineUsers[otherUserId] || false;
                  return isOtherOnline ? (
                    <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-green-500 border-2 border-surface rounded-full" />
                  ) : null;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary text-sm">
                  {activeConversation.car_ad?.title}
                </h3>
                <p className="text-xs text-text-tertiary flex items-center gap-1">
                  {activeConversation && (() => {
                    const otherUserId = user?.id === activeConversation.seller?.id
                      ? activeConversation.buyer?.id
                      : activeConversation.seller?.id;
                    const isOtherOnline = onlineUsers[otherUserId] || false;
                    return isOtherOnline ? (
                      <span className="text-green-500">آنلاین</span>
                    ) : (
                      <span>آفلاین</span>
                    );
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

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-surface-secondary">
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
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender?.id === user?.id;
                    const prevMsg = messages[index - 1];
                    const showDate = !prevMsg || 
                      new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

                    return (
                      <motion.div key={msg.id} variants={fadeUpItem}>
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
                                ? 'bg-brand-500 text-white rounded-bl-md rounded-br-sm'
                                : 'bg-surface border border-border text-text-primary rounded-br-md rounded-bl-sm'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-start' : 'justify-end'}`}>
                              <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-text-tertiary'}`}>
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-border bg-surface">
              <div className="flex items-center gap-2 bg-surface-tertiary rounded-2xl px-4 py-2 border border-border focus-within:border-brand-500 transition-colors">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 bg-transparent text-sm focus:outline-none text-text-primary placeholder:text-text-tertiary"
                  disabled={sending}
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
