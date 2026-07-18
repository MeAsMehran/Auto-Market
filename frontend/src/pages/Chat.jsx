import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Send, Phone, Car, CheckCheck, MoreVertical, ArrowLeft, User, MessageCircle } from 'lucide-react';

const MOCK_CONVERSATIONS = [
  { id: 1, name: 'امیر ر.', lastMessage: 'آیا قیمت قابل مذاکره است؟', time: '۲ دقیقه پیش', unread: 2, online: true, car: 'تسلا مدل ۳', avatar: null },
  { id: 2, name: 'سارا م.', lastMessage: 'حتماً، کی میتونم بیام ببینم؟', time: '۱ ساعت پیش', unread: 0, online: false, car: 'بامو X5', avatar: null },
  { id: 3, name: 'رضا ک.', lastMessage: 'ممنون از اطلاعات شما', time: '۳ ساعت پیش', unread: 0, online: true, car: 'مرسدس C300', avatar: null },
  { id: 4, name: 'مریم ج.', lastMessage: 'میشه عکس‌های بیشتری بفرستید؟', time: '۱ روز پیش', unread: 1, online: false, car: 'هیوندای النترا', avatar: null },
  { id: 5, name: 'حسن پ.', lastMessage: 'میگیرمش. بهم خبر بده...', time: '۲ روز پیش', unread: 0, online: false, car: 'نیسان آلتیما', avatar: null },
];

const MOCK_MESSAGES = [
  { id: 1, text: 'سلام، این خودرو هنوز موجود است؟', sender: 'them', time: '۱۰:۳۰ ق.ظ' },
  { id: 2, text: 'بله موجود است! علاقه‌مند هستید؟', sender: 'me', time: '۱۰:۳۲ ق.ظ' },
  { id: 3, text: 'حتماً. میشه بیشتر درباره وضعیتش توضیح بدید؟', sender: 'them', time: '۱۰:۳۳ ق.ظ' },
  { id: 4, text: 'وضعیت عالی است. سرویس دوره‌ای، بدون تصادف. می‌توانید بیایید شخصاً بررسی کنید.', sender: 'me', time: '۱۰:۳۵ ق.ظ' },
  { id: 5, text: 'عالیه! قیمت چطور؟ قابل مذاکره است؟', sender: 'them', time: '۱۰:۳۶ ق.ظ' },
  { id: 6, text: 'اگه امروز بیایید میتونم $۴۴,۰۰۰ کنم.', sender: 'me', time: '۱۰:۳۸ ق.ظ' },
];

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);

  const filteredConversations = MOCK_CONVERSATIONS.filter(
    (c) => c.name.includes(searchQuery) || c.car.includes(searchQuery)
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setNewMessage('');
  };

  const activeConversation = selectedChat ? MOCK_CONVERSATIONS.find((c) => c.id === selectedChat) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="bg-white rounded-2xl border border-border overflow-hidden h-[calc(100vh-12rem)] min-h-[500px] flex">
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

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                <p className="text-sm text-text-tertiary">هنوز گفتگویی ندارید</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setSelectedChat(conv.id); setShowMobileList(false); }}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-surface-secondary transition-colors border-b border-border-light text-right ${selectedChat === conv.id ? 'bg-brand-50' : ''}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-500" />
                    </div>
                    {conv.online && <span className="absolute bottom-0 left-0 w-3 h-3 bg-accent-500 border-2 border-white rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-text-primary text-sm truncate">{conv.name}</h3>
                      <span className="text-xs text-text-tertiary shrink-0">{conv.time}</span>
                    </div>
                    <p className="text-xs text-text-tertiary truncate">{conv.car}</p>
                    <p className="text-sm text-text-secondary truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {selectedChat && activeConversation ? (
          <div className={`flex-1 flex flex-col ${showMobileList && 'hidden sm:flex'}`}>
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={() => setShowMobileList(true)} className="sm:hidden p-1 hover:bg-surface-tertiary rounded-lg">
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-500" />
                </div>
                {activeConversation.online && <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-accent-500 border-2 border-white rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary text-sm">{activeConversation.name}</h3>
                <p className="text-xs text-text-tertiary">
                  {activeConversation.online ? 'آنلاین' : 'آفلاین'} &middot; {activeConversation.car}
                </p>
              </div>
              <a href="tel:+989123456789" className="p-2 text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors">
                <Phone className="w-5 h-5" />
              </a>
              <button className="p-2 text-text-secondary hover:bg-surface-tertiary rounded-xl transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {MOCK_MESSAGES.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === 'me' ? 'bg-brand-500 text-white rounded-bl-md' : 'bg-surface-tertiary text-text-primary rounded-br-md'}`}>
                    <p>{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
                      <span className={`text-[10px] ${msg.sender === 'me' ? 'text-white/70' : 'text-text-tertiary'}`}>{msg.time}</span>
                      {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-white/70" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 px-4 py-2.5 bg-surface-tertiary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center bg-surface-secondary">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">پیام‌های شما</h3>
              <p className="text-text-secondary text-sm max-w-xs">یک گفتگو را انتخاب کنید یا آگهی‌ها را مرور کنید تا با فروشندگان ارتباط برقرار کنید.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
