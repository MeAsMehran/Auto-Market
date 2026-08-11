import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, CheckCheck, MoreVertical, ArrowLeft, User, MessageCircle, AlertCircle, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '../components/AnimatedPage';
import { listConversations, deleteConversation, getConversation, listMessages, sendMessage } from '../lib/chatApi';
import { useAuth } from '../context/AuthContext';

// ============================================
// Toast Notification System
// ============================================
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

// ============================================
// Main Chat Component
// ============================================
export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  // Toast state
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);

  // ============================================
  // Toast Helper
  // ============================================
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  // ============================================
  // Load Conversations
  // ============================================
  const loadConversations = useCallback(async () => {
    try {
      const data = await listConversations();
      // Ensure data is always an array
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      showToast('خطا در بارگذاری گفتگوها', 'error');
      setConversations([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ============================================
  // Load Messages + Polling for Real-time
  // ============================================
  const loadMessages = useCallback(async (conversationId) => {
    try {
      setLoadingMessages(true);
      const conversation = await getConversation(conversationId);
      const msgs = await listMessages(conversationId);
      setActiveConversation(conversation);
      // Ensure messages is always an array
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error('Failed to load messages:', err);
      showToast('خطا در بارگذاری پیام‌ها', 'error');
      setMessages([]); // Reset to empty array on error
    } finally {
      setLoadingMessages(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat, loadMessages]);

  // ============================================
  // Polling for Real-time Updates
  // ============================================
  useEffect(() => {
    if (selectedChat) {
      // Poll every 5 seconds for new messages
      const interval = setInterval(async () => {
        try {
          const msgs = await listMessages(selectedChat);
          // Ensure msgs is always an array
          const safeMsgs = Array.isArray(msgs) ? msgs : [];
          setMessages((prev) => {
            // Only update if there are new messages
            if (safeMsgs.length !== prev.length) {
              return safeMsgs;
            }
            // Check if any message content changed
            const hasChanges = safeMsgs.some((newMsg, idx) => {
              const prevMsg = prev[idx];
              return prevMsg && (newMsg.content !== prevMsg.content || newMsg.id !== prevMsg.id);
            });
            return hasChanges ? safeMsgs : prev;
          });
        } catch (err) {
          // Silent fail for polling - don't show toast every 5 seconds
          console.error('Polling error:', err);
        }
      }, 5000);

      setPollingInterval(interval);

      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  // ============================================
  // Scroll to Bottom
  // ============================================
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ============================================
  // Optimistic Send Message
  // ============================================
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: newMessage.trim(),
      sender: user,
      created_at: new Date().toISOString(),
      _isOptimistic: true,
    };

    try {
      setSending(true);
      
      // Optimistic update - add message immediately
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage('');
      
      // Scroll to show new message
      setTimeout(scrollToBottom, 100);

      // Send to server
      const savedMessage = await sendMessage(selectedChat, newMessage.trim());
      
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? savedMessage : msg
        )
      );
      
      showToast('پیام ارسال شد', 'success');
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(newMessage.trim()); // Restore message
      
      showToast(err.response?.data?.detail || 'خطا در ارسال پیام', 'error');
    } finally {
      setSending(false);
    }
  };

  // ============================================
  // Delete Conversation
  // ============================================
  const handleDelete = async (e, conversationId) => {
    e.stopPropagation();
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید این گفتگو را حذف کنید؟')) return;

    try {
      await deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      
      if (selectedChat === conversationId) {
        setSelectedChat(null);
        setActiveConversation(null);
        setMessages([]);
      }
      
      showToast('گفتگو حذف شد', 'success');
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      showToast('خطا در حذف گفتگو', 'error');
    }
  };

  // ============================================
  // Select Chat
  // ============================================
  const handleSelectChat = (conversation) => {
    setSelectedChat(conversation.id);
    setShowMobileList(false);
  };

  // ============================================
  // Back to List
  // ============================================
  const handleBack = () => {
    setShowMobileList(true);
    setSelectedChat(null);
    setActiveConversation(null);
    setMessages([]);
  };

  // ============================================
  // Filter Conversations
  // ============================================
  const filteredConversations = conversations.filter((c) => {
    const carAd = c.car_ad || {};
    const seller = carAd.seller || {};
    const searchText = searchQuery.toLowerCase();
    return (
      (seller.name && seller.name.toLowerCase().includes(searchText)) ||
      (carAd.title && carAd.title.toLowerCase().includes(searchText)) ||
      (carAd.brand && carAd.brand.toLowerCase().includes(searchText))
    );
  });

  // ============================================
  // Helper Functions
  // ============================================
  const getOtherUser = (conversation) => {
    const carAd = conversation.car_ad || {};
    const seller = carAd.seller || {};
    if (seller.id === user?.id) {
      return { name: 'شما', isSelf: true };
    }
    return { name: seller.name || 'کاربر', isSelf: false };
  };

  const formatDate = (dateString) => {
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
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Toast Notification */}
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
        {/* Conversation List */}
        <div className={`w-full sm:w-96 border-l border-border flex flex-col ${!showMobileList && 'hidden sm:flex'}`}>
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-text-primary text-lg mb-3">پیام‌ها</h2>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="جستجوی گفتگوها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex-1 overflow-y-auto"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                <p className="text-sm text-text-tertiary">هنوز گفتگویی ندارید</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const otherUser = getOtherUser(conv);
                return (
                  <motion.button
                    key={conv.id}
                    variants={fadeUpItem}
                    whileHover={{ x: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={() => handleSelectChat(conv)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-surface-secondary transition-colors border-b border-border-light text-right will-change-transform ${
                      selectedChat === conv.id ? 'bg-brand-50 dark:bg-brand-950' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-text-primary text-sm truncate">
                          {conv.car_ad?.title || 'بدون عنوان'}
                        </h3>
                        <span className="text-xs text-text-tertiary shrink-0">
                          {formatDate(conv.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary truncate">
                        {otherUser.isSelf ? 'گفتگو با خودتان' : `گفتگو با ${otherUser.name}`}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {conv.car_ad?.brand} {conv.car_ad?.model_name}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="p-1 text-text-tertiary hover:text-red-500 shrink-0"
                      title="حذف گفتگو"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </motion.button>
                );
              })
            )}
          </motion.div>
        </div>

        {/* Chat Window */}
        {selectedChat && activeConversation ? (
          <div className={`flex-1 flex flex-col ${showMobileList && 'hidden sm:flex'}`}>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
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
                  {activeConversation.car_ad?.title}
                </h3>
                <p className="text-xs text-text-tertiary">
                  {activeConversation.car_ad?.brand} {activeConversation.car_ad?.model_name} · ${activeConversation.car_ad?.price}
                </p>
              </div>
              {activeConversation.car_ad?.images?.[0] && (
                <img
                  src={activeConversation.car_ad.images[0].image}
                  alt={activeConversation.car_ad.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-surface-secondary">
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
                  className="space-y-3"
                >
                  {messages.map((msg) => {
                    const isOwn = msg.sender?.id === user?.id;
                    const isOptimistic = msg._isOptimistic;
                    
                    return (
                      <motion.div
                        key={msg.id}
                        variants={fadeUpItem}
                        className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            isOwn
                              ? 'bg-brand-500 text-white rounded-bl-md'
                              : 'bg-surface border border-border text-text-primary rounded-br-md'
                          } ${isOptimistic ? 'opacity-70' : ''}`}
                        >
                          {isOptimistic && (
                            <div className="text-xs mb-1 text-white/70">در حال ارسال...</div>
                          )}
                          <p>{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-start' : 'justify-end'}`}>
                            <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-text-tertiary'}`}>
                              {formatTime(msg.created_at)}
                            </span>
                            {isOwn && !isOptimistic && <CheckCheck className="w-3 h-3 text-white/70" />}
                            {isOwn && isOptimistic && <div className="w-3 h-3 border border-white/70 rounded-full" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 px-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-xl transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
