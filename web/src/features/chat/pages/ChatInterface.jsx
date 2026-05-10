import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatApi, authApi } from '../../../shared/api/api';

export default function ChatInterface() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactQuery, setContactQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    authApi.me().then((r) => setMe(r.data)).catch(() => {});
  }, []);

  const loadContacts = useCallback(async (q = '') => {
    try {
      const res = await chatApi.contacts(q);
      setContacts(res.data || []);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => { loadContacts(''); }, [loadContacts]);

  useEffect(() => {
    const t = setTimeout(() => loadContacts(contactQuery), 350);
    return () => clearTimeout(t);
  }, [contactQuery, loadContacts]);

  const loadMessages = useCallback(async (userId) => {
    if (!userId) return;
    setLoadingMessages(true);
    try {
      const res = await chatApi.conversation(userId);
      setMessages(res.data || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedContact) return;
    loadMessages(selectedContact.userId);
    pollRef.current = setInterval(() => loadMessages(selectedContact.userId), 5000);
    return () => clearInterval(pollRef.current);
  }, [selectedContact, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selectedContact) return;
    setSending(true);
    const content = text.trim();
    setText('');
    try {
      await chatApi.sendMessage({ receiverId: selectedContact.userId, content });
      await loadMessages(selectedContact.userId);
    } catch {
      setText(content); // restore on failure
    } finally {
      setSending(false);
    }
  }

  function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function formatDay(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Group messages by day
  const grouped = messages.reduce((acc, msg) => {
    const day = formatDay(msg.sentAt || msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
              <span className="text-white text-xs">⚕</span>
            </div>
            <span className="font-bold" style={{ color: '#7C2327' }}>MediGo</span>
          </div>
        </div>
        <h1 className="text-base font-semibold text-gray-800">Messages</h1>
        <div className="w-16" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Contacts sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
                placeholder="Search contacts…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
              <div className="flex justify-center py-8">
                <span className="w-6 h-6 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm px-4">
                No contacts found.
              </div>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.userId}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selectedContact?.userId === contact.userId
                      ? 'bg-rose-50 border-r-2 border-rose-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-sm font-semibold flex-shrink-0" style={{ color: '#7C2327' }}>
                    {(contact.firstName?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.role && (
                      <p className="text-xs text-gray-400 truncate">{contact.role}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center space-y-2">
                <div className="text-4xl">💬</div>
                <p className="text-sm">Select a contact to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-sm font-semibold" style={{ color: '#7C2327' }}>
                  {(selectedContact.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </p>
                  {selectedContact.role && (
                    <p className="text-xs text-gray-400">{selectedContact.role}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <span className="w-6 h-6 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No messages yet. Say hello! 👋
                  </div>
                ) : (
                  Object.entries(grouped).map(([day, msgs]) => (
                    <div key={day}>
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">{day}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      <div className="space-y-2">
                        {msgs.map((msg) => {
                          const isMe = String(msg.senderId) === String(me?.id);
                          return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                                isMe
                                  ? 'text-white rounded-br-sm'
                                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                              }`} style={isMe ? { backgroundColor: '#7C2327' } : {}}>
                                <p className="leading-relaxed">{msg.content}</p>
                                <p className={`text-xs mt-1 ${isMe ? 'text-rose-200' : 'text-gray-400'}`}>
                                  {formatTime(msg.sentAt || msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="bg-white border-t border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-all hover:-translate-y-0.5 flex-shrink-0"
                  style={{ backgroundColor: '#7C2327' }}
                  aria-label="Send message"
                >
                  {sending ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
