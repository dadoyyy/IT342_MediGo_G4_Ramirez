import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, MessageSquare } from 'lucide-react';
import { chatApi, authApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';

function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function fmtDay(ts) {
  if (!ts) return '';
  const d = new Date(ts), today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const y = new Date(today); y.setDate(today.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChatInterface() {
  const [me, setMe] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactQuery, setContactQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => { authApi.me().then(r => setMe(r.data?.data ?? r.data)).catch(() => {}); }, []);

  const loadContacts = useCallback(async (q = '') => {
    try {
      const res = await chatApi.contacts(q);
      const list = res.data?.data ?? res.data;
      setContacts(Array.isArray(list) ? list : []);
    } catch { setContacts([]); }
    finally { setLoadingContacts(false); }
  }, []);

  useEffect(() => { loadContacts(''); }, [loadContacts]);
  useEffect(() => {
    const t = setTimeout(() => loadContacts(contactQuery), 350);
    return () => clearTimeout(t);
  }, [contactQuery, loadContacts]);

  const loadMessages = useCallback(async (userId) => {
    if (!userId) return;
    setLoadingMsgs(true);
    try {
      const res = await chatApi.conversation(userId);
      const list = res.data?.data ?? res.data;
      setMessages(Array.isArray(list) ? list : []);
    } catch { setMessages([]); }
    finally { setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.userId);
    pollRef.current = setInterval(() => loadMessages(selected.userId), 5000);
    return () => clearInterval(pollRef.current);
  }, [selected, loadMessages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selected) return;
    setSending(true);
    const content = text.trim(); setText('');
    try {
      await chatApi.sendMessage({ receiverId: selected.userId, content });
      await loadMessages(selected.userId);
    } catch { setText(content); }
    finally { setSending(false); }
  }

  const grouped = messages.reduce((acc, msg) => {
    const day = fmtDay(msg.sentAt || msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <AppShell user={me}>
      <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>
        {/* Contacts sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col bg-white"
          style={{ borderRight: '1px solid #F3F4F6' }}>
          <div className="p-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <h2 className="text-sm font-bold mb-3" style={{ color: '#1F2937' }}>Messages</h2>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
              <input type="text" value={contactQuery} onChange={e => setContactQuery(e.target.value)}
                placeholder="Search…" className="mg-input pl-9" style={{ padding: '8px 12px 8px 32px', fontSize: '13px' }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(20,184,166,0.2)', borderTopColor: '#14B8A6' }} />
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-center text-xs py-8" style={{ color: '#9CA3AF' }}>No contacts found</p>
            ) : contacts.map(c => (
              <button key={c.userId} onClick={() => setSelected(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={selected?.userId === c.userId
                  ? { background: '#F0FDFA', borderRight: '2px solid #14B8A6' }
                  : { borderRight: '2px solid transparent' }
                }>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #CCFBF1, #EDE9FE)', color: '#0D9488' }}>
                  {(c.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#1F2937' }}>{c.firstName} {c.lastName}</p>
                  {c.role && <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{c.role}</p>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#F7F9FC' }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: '#EEF2FF', border: '1.5px solid #C7D2FE' }}>
                  <MessageSquare size={22} style={{ color: '#8B93FF' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Select a contact to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0 bg-white"
                style={{ borderBottom: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(31,41,55,0.04)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #CCFBF1, #EDE9FE)', color: '#0D9488' }}>
                  {(selected.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1F2937' }}>{selected.firstName} {selected.lastName}</p>
                  {selected.role && <p className="text-xs" style={{ color: '#9CA3AF' }}>{selected.role}</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {loadingMsgs ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'rgba(20,184,166,0.2)', borderTopColor: '#14B8A6' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm py-8" style={{ color: '#9CA3AF' }}>No messages yet. Say hello! 👋</p>
                ) : Object.entries(grouped).map(([day, msgs]) => (
                  <div key={day}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs px-3 py-1 rounded-full bg-white border border-gray-100" style={{ color: '#9CA3AF' }}>{day}</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="space-y-2">
                      {msgs.map(msg => {
                        const isMe = String(msg.senderId) === String(me?.id);
                        return (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm"
                              style={isMe
                                ? { background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', color: '#fff', borderBottomRightRadius: '4px', boxShadow: '0 2px 8px rgba(20,184,166,0.2)' }
                                : { background: '#fff', border: '1px solid #F3F4F6', color: '#1F2937', borderBottomLeftRadius: '4px', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }
                              }>
                              <p className="leading-relaxed">{msg.content}</p>
                              <p className="text-xs mt-1" style={{ color: isMe ? 'rgba(255,255,255,0.6)' : '#9CA3AF' }}>
                                {fmtTime(msg.sentAt || msg.createdAt)}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="flex items-center gap-3 px-5 py-4 flex-shrink-0 bg-white"
                style={{ borderTop: '1px solid #F3F4F6' }}>
                <input type="text" value={text} onChange={e => setText(e.target.value)}
                  placeholder="Type a message…" className="mg-input flex-1" style={{ padding: '10px 16px' }} />
                <button type="submit" disabled={!text.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', border: 'none', boxShadow: '0 2px 8px rgba(20,184,166,0.25)' }}>
                  {sending
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send size={15} color="#fff" />
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
