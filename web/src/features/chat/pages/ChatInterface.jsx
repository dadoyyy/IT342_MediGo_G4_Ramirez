import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      <div className="flex h-full" style={{ height: 'calc(100vh - 57px)' }}>
        {/* Contacts */}
        <aside className="w-64 flex-shrink-0 flex flex-col"
          style={{ background: '#0F1525', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#F7F8FA' }}>Messages</h2>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(247,248,250,0.3)' }} />
              <input type="text" value={contactQuery} onChange={e => setContactQuery(e.target.value)}
                placeholder="Search…" className="mg-input pl-9" style={{ padding: '8px 12px 8px 32px', fontSize: '13px' }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-center text-xs py-8" style={{ color: 'rgba(247,248,250,0.3)' }}>No contacts found</p>
            ) : contacts.map(c => (
              <button key={c.userId} onClick={() => setSelected(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={selected?.userId === c.userId
                  ? { background: 'rgba(46,196,182,0.08)', borderRight: '2px solid #2EC4B6' }
                  : { borderRight: '2px solid transparent' }
                }>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(46,196,182,0.2), rgba(155,140,255,0.2))', color: '#2EC4B6' }}>
                  {(c.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: '#F7F8FA' }}>{c.firstName} {c.lastName}</p>
                  {c.role && <p className="text-xs truncate" style={{ color: 'rgba(247,248,250,0.3)' }}>{c.role}</p>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(155,140,255,0.08)', border: '1px solid rgba(155,140,255,0.15)' }}>
                  <MessageSquare size={22} style={{ color: 'rgba(155,140,255,0.5)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'rgba(247,248,250,0.4)' }}>Select a contact to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
                style={{ background: '#0F1525', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, rgba(46,196,182,0.2), rgba(155,140,255,0.2))', color: '#2EC4B6' }}>
                  {(selected.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F7F8FA' }}>{selected.firstName} {selected.lastName}</p>
                  {selected.role && <p className="text-xs" style={{ color: 'rgba(247,248,250,0.3)' }}>{selected.role}</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {loadingMsgs ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm py-8" style={{ color: 'rgba(247,248,250,0.3)' }}>No messages yet. Say hello! 👋</p>
                ) : Object.entries(grouped).map(([day, msgs]) => (
                  <div key={day}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(247,248,250,0.3)' }}>{day}</span>
                      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                    <div className="space-y-2">
                      {msgs.map(msg => {
                        const isMe = String(msg.senderId) === String(me?.id);
                        return (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm"
                              style={isMe
                                ? { background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#0B1020', borderBottomRightRadius: '4px' }
                                : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#F7F8FA', borderBottomLeftRadius: '4px' }
                              }>
                              <p className="leading-relaxed">{msg.content}</p>
                              <p className="text-xs mt-1" style={{ color: isMe ? 'rgba(11,16,32,0.5)' : 'rgba(247,248,250,0.3)' }}>
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
              <form onSubmit={handleSend} className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
                style={{ background: '#0F1525', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <input type="text" value={text} onChange={e => setText(e.target.value)}
                  placeholder="Type a message…" className="mg-input flex-1" style={{ padding: '10px 16px' }} />
                <button type="submit" disabled={!text.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', border: 'none' }}>
                  {sending
                    ? <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(11,16,32,0.3)', borderTopColor: '#0B1020' }} />
                    : <Send size={15} color="#0B1020" />
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
