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
      <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>

        {/* Contacts sidebar */}
        <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRight: '1px solid rgba(43,45,66,0.08)' }}>
          <div style={{ padding: 16, borderBottom: '1px solid rgba(43,45,66,0.08)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', marginBottom: 4 }}>Your conversations</p>
            <p style={{ fontSize: 11, color: '#8D99AE', marginBottom: 12 }}>Chat with your healthcare contacts</p>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(43,45,66,0.4)' }} />
              <input type="text" value={contactQuery} onChange={e => setContactQuery(e.target.value)}
                placeholder="Search…" className="mg-input" style={{ paddingLeft: 32, padding: '8px 12px 8px 32px', fontSize: 13, background: 'rgba(237,242,244,0.5)', border: '1px solid rgba(43,45,66,0.08)' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingContacts ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(43,45,66,0.5)', marginBottom: 6 }}>No contacts yet</p>
                <p style={{ fontSize: 11, color: 'rgba(43,45,66,0.4)', lineHeight: 1.5 }}>
                  You can message doctors once you have a confirmed or completed appointment with them.
                </p>
              </div>
            ) : contacts.map(c => (
              <button key={c.userId} onClick={() => setSelected(c)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', background: selected?.userId === c.userId ? 'rgba(239,35,60,0.04)' : 'transparent', borderRight: `2px solid ${selected?.userId === c.userId ? '#EF233C' : 'transparent'}`, border: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, background: 'linear-gradient(135deg, rgba(239,35,60,0.1), rgba(217,4,41,0.15))', color: '#EF233C' }}>
                  {(c.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.firstName} {c.lastName}</p>
                  {c.role && <p style={{ fontSize: 10, color: 'rgba(43,45,66,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role}</p>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#EDF2F4' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', background: 'rgba(43,45,66,0.04)', border: '1px solid rgba(43,45,66,0.08)' }}>
                  <MessageSquare size={22} style={{ color: 'rgba(43,45,66,0.3)' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#8D99AE' }}>Select a contact to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(43,45,66,0.08)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg, rgba(239,35,60,0.1), rgba(217,4,41,0.15))', color: '#EF233C' }}>
                  {(selected.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#2B2D42' }}>{selected.firstName} {selected.lastName}</p>
                  {selected.role && <p style={{ fontSize: 10, color: 'rgba(43,45,66,0.5)' }}>{selected.role}</p>}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {loadingMsgs ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                    <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(43,45,66,0.5)', padding: '32px 0' }}>No messages yet. Say hello!</p>
                ) : Object.entries(grouped).map(([day, msgs]) => (
                  <div key={day}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.06)' }} />
                      <span style={{ fontSize: 11, color: 'rgba(43,45,66,0.5)', padding: '3px 10px', borderRadius: 99, background: 'rgba(43,45,66,0.04)', border: '1px solid rgba(43,45,66,0.06)' }}>{day}</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.06)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {msgs.map(msg => {
                        const isMe = String(msg.senderId) === String(me?.id);
                        return (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{ maxWidth: 320, padding: '10px 14px', borderRadius: 18, fontSize: 14, ...(isMe
                              ? { background: 'linear-gradient(135deg, #EF233C, #D90429)', color: '#fff', borderBottomRightRadius: 4, boxShadow: '0 4px 16px rgba(239,35,60,0.2)' }
                              : { background: '#FFFFFF', border: '1px solid rgba(43,45,66,0.08)', color: '#2B2D42', borderBottomLeftRadius: 4, boxShadow: '0 2px 8px rgba(43,45,66,0.02)' }
                            ) }}>
                              <p style={{ lineHeight: 1.5 }}>{msg.content}</p>
                              <p style={{ fontSize: 11, marginTop: 4, color: isMe ? 'rgba(255,255,255,0.6)' : 'rgba(43,45,66,0.4)' }}>
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
              <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'rgba(255,255,255,0.9)', borderTop: '1px solid rgba(43,45,66,0.08)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
                <input type="text" value={text} onChange={e => setText(e.target.value)}
                  placeholder="Type a message…" className="mg-input" style={{ flex: 1, padding: '10px 16px', background: 'rgba(237,242,244,0.5)', border: '1px solid rgba(43,45,66,0.08)' }} />
                <button type="submit" disabled={!text.trim() || sending}
                  style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #EF233C, #D90429)', border: 'none', cursor: 'pointer', opacity: (!text.trim() || sending) ? 0.4 : 1, transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(239,35,60,0.25)' }}>
                  {sending ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={15} color="#fff" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
