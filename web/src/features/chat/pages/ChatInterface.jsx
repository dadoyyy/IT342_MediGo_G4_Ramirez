import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, MessageSquare, Phone, Video, MoreVertical, CheckCheck, Clock } from 'lucide-react';
import { chatApi, authApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import AuthImage from '../../../shared/ui/AuthImage';

const APPT_CONFIRM_TAG = '[APPT_CONFIRMED]';

function parseAppointmentConfirmation(content) {
  if (!content || !content.startsWith(APPT_CONFIRM_TAG)) return null;
  const data = {};
  content.split('|').slice(1).forEach(part => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      data[part.slice(0, idx)] = part.slice(idx + 1);
    }
  });
  return data;
}

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
  const inputRef = useRef(null);

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
    try {
      const res = await chatApi.conversation(userId);
      const list = res.data?.data ?? res.data;
      setMessages(Array.isArray(list) ? list : []);
    } catch { setMessages([]); }
    finally { setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingMsgs(true);
    loadMessages(selected.userId);
    pollRef.current = setInterval(() => loadMessages(selected.userId), 4000);
    return () => clearInterval(pollRef.current);
  }, [selected, loadMessages]);

  useEffect(() => { 
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [messages]);

  async function handleSend(e) {
    if (e) e.preventDefault();
    if (!text.trim() || !selected || sending) return;
    
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      await chatApi.sendMessage({ receiverId: selected.userId, content });
      await loadMessages(selected.userId);
    } catch { 
      setText(content); 
    } finally { 
      setSending(false); 
    }
  }

  const grouped = messages.reduce((acc, msg) => {
    const day = fmtDay(msg.sentAt || msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastIncomingConfirmation = lastMsg && String(lastMsg.senderId) !== String(me?.id)
    ? parseAppointmentConfirmation(lastMsg.content)
    : null;
  const showQuickReplies = me?.role === 'PATIENT' && Boolean(lastIncomingConfirmation);
  const quickReplies = [
    'Thank you, doctor. I confirm my attendance.',
    'Is there anything I should prepare for my visit?',
    'I appreciate the confirmation. See you there!'
  ];

  return (
    <AppShell user={me}>
      <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          display: 'flex', flex: 1, height: '100%', minHeight: 0, overflow: 'hidden', 
          background: '#FFFFFF', borderRadius: 24, 
          border: '1px solid rgba(43,45,66,0.06)',
          boxShadow: '0 8px 32px rgba(43,45,66,0.03)'
        }}>

        {/* Contacts sidebar */}
        <aside style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRight: '1px solid rgba(43,45,66,0.06)', zIndex: 10 }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(43,45,66,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em' }}>Messages</h2>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,35,60,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={16} style={{ color: '#EF233C' }} />
              </div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
              <input type="text" value={contactQuery} onChange={e => setContactQuery(e.target.value)}
                placeholder="Search conversations..." 
                className="mg-input" 
                style={{ paddingLeft: 42, background: '#F8F9FA', border: '1px solid rgba(43,45,66,0.05)', fontSize: 13, height: 44, borderRadius: 12 }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
            {loadingContacts ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.1)', borderTopColor: '#EF233C' }} />
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(141,153,174,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                   <MessageSquare size={20} style={{ color: '#8D99AE' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2B2D42', marginBottom: 8 }}>No active chats</p>
                <p style={{ fontSize: 12, color: '#8D99AE', lineHeight: 1.6 }}>Message doctors once you have an appointment confirmed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {contacts.map(c => {
                  const isSelected = selected?.userId === c.userId;
                  return (
                    <motion.button 
                      key={c.userId} 
                      onClick={() => setSelected(c)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{ 
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', 
                        borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', 
                        background: isSelected ? 'rgba(239,35,60,0.04)' : 'transparent', 
                        border: isSelected ? '1px solid rgba(239,35,60,0.1)' : '1px solid transparent',
                        boxShadow: isSelected ? '0 4px 12px rgba(239,35,60,0.04)' : 'none'
                      }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(239,35,60,0.08), rgba(43,45,66,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AuthImage src={c.profilePictureUrl} alt={c.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            fallback={<span style={{ fontSize: 15, fontWeight: 700, color: '#EF233C' }}>{(c.firstName?.[0] || '?').toUpperCase()}</span>} />
                        </div>
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#22C55E', border: '2px solid #fff' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                            {c.role === 'DOCTOR' ? `Dr. ${c.firstName} ${c.lastName}` : `${c.firstName} ${c.lastName}`}
                          </p>
                        </div>
                        <p style={{ fontSize: 12, color: '#8D99AE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{c.role || 'User'}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F0F2F5' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
              <div style={{ textAlign: 'center', maxWidth: 300 }}>
                <div style={{ width: 80, height: 80, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', background: 'rgba(239,35,60,0.03)', border: '1px solid rgba(239,35,60,0.06)' }}>
                  <MessageSquare size={32} style={{ color: 'rgba(239,35,60,0.2)' }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42', marginBottom: 8 }}>Select a conversation</h3>
                <p style={{ fontSize: 14, color: '#8D99AE', lineHeight: 1.6 }}>Choose a contact from the sidebar to view your messages and start chatting.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', 
                background: '#FFFFFF', borderBottom: '1px solid rgba(43,45,66,0.06)', flexShrink: 0,
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(239,35,60,0.1), rgba(43,45,66,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AuthImage src={selected.profilePictureUrl} alt={selected.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      fallback={<span style={{ fontSize: 16, fontWeight: 700, color: '#EF233C' }}>{(selected.firstName?.[0] || '?').toUpperCase()}</span>} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2B2D42', margin: 0 }}>
                      {selected.role === 'DOCTOR' ? `Dr. ${selected.firstName} ${selected.lastName}` : `${selected.firstName} ${selected.lastName}`}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#22C55E' }}>Online</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <button style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(43,45,66,0.06)', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#2B2D42' }}><Phone size={16} /></button>
                   <button style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(43,45,66,0.06)', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#2B2D42' }}><Video size={16} /></button>
                   <button style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(43,45,66,0.06)', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#2B2D42' }}><MoreVertical size={16} /></button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, scrollbarWidth: 'none' }}>
                {loadingMsgs ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.1)', borderTopColor: '#EF233C' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                     <p style={{ fontSize: 14, fontWeight: 500, color: '#8D99AE' }}>No messages yet. Say hello! 👋</p>
                  </div>
                ) : Object.entries(grouped).map(([day, msgs]) => (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.05)' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{day}</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.05)' }} />
                    </div>
                    
                    {msgs.map((msg, i) => {
                      const isMe = String(msg.senderId) === String(me?.id);
                      const apptData = parseAppointmentConfirmation(msg.content);
                      
                      return (
                        <motion.div 
                          key={msg.id} 
                          initial={{ opacity: 0, x: isMe ? 10 : -10 }} 
                          animate={{ opacity: 1, x: 0 }}
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start' 
                          }}>
                          
                          <div style={{ 
                            maxWidth: '75%', 
                            padding: apptData ? '20px' : '12px 18px', 
                            borderRadius: 20, 
                            fontSize: 14,
                            lineHeight: 1.6,
                            position: 'relative',
                            background: apptData ? '#FFFFFF' : (isMe ? 'linear-gradient(135deg, #EF233C, #D90429)' : '#FFFFFF'),
                            color: apptData ? '#2B2D42' : (isMe ? '#FFFFFF' : '#2B2D42'),
                            boxShadow: isMe ? '0 6px 16px rgba(239,35,60,0.12)' : '0 4px 12px rgba(43,45,66,0.04)',
                            border: apptData ? '1px solid rgba(43,45,66,0.08)' : (isMe ? 'none' : '1px solid rgba(43,45,66,0.05)')
                          }}>
                            {apptData ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid rgba(43,45,66,0.06)' }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCheck size={16} style={{ color: '#16A34A' }} />
                                  </div>
                                  <p style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#2B2D42' }}>Appointment Confirmed</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                  {Object.entries(apptData).map(([key, val]) => (
                                    <div key={key}>
                                      <p style={{ fontSize: 10, color: '#8D99AE', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{key}</p>
                                      <p style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', margin: 0 }}>{val}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p style={{ margin: 0 }}>{msg.content}</p>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, opacity: 0.6 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#8D99AE' }}>{fmtTime(msg.sentAt || msg.createdAt)}</span>
                            {isMe && <CheckCheck size={12} style={{ color: '#EF233C' }} />}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Input Area */}
              <div style={{ 
                background: '#FFFFFF', padding: '20px 24px', 
                borderTop: '1px solid rgba(43,45,66,0.06)', flexShrink: 0 
              }}>
                {showQuickReplies && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                    {quickReplies.map(reply => (
                      <motion.button
                        key={reply}
                        type="button"
                        whileHover={{ y: -2, background: 'rgba(239,35,60,0.04)' }}
                        onClick={() => setText(reply)}
                        style={{ 
                          fontSize: 11, fontWeight: 700, padding: '8px 16px', 
                          borderRadius: 99, border: '1px solid rgba(239,35,60,0.15)', 
                          background: '#FFFFFF', color: '#EF233C', cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {reply}
                      </motion.button>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input 
                      ref={inputRef} 
                      type="text" 
                      value={text} 
                      onChange={e => setText(e.target.value)}
                      placeholder="Type your message here..." 
                      className="mg-input" 
                      style={{ 
                        padding: '14px 20px', background: '#F8F9FA', 
                        border: '1px solid rgba(43,45,66,0.05)', borderRadius: 16,
                        fontSize: 14, transition: 'all 0.2s'
                      }} 
                    />
                  </div>
                  <motion.button 
                    type="submit" 
                    disabled={!text.trim() || sending}
                    whileHover={(!text.trim() || sending) ? {} : { scale: 1.05 }}
                    whileTap={(!text.trim() || sending) ? {} : { scale: 0.95 }}
                    style={{ 
                      width: 48, height: 48, borderRadius: 16, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      flexShrink: 0, background: 'linear-gradient(135deg, #EF233C, #D90429)', 
                      border: 'none', cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(239,35,60,0.25)',
                      opacity: (!text.trim() || sending) ? 0.4 : 1
                    }}>
                    {sending ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={18} color="#fff" />}
                  </motion.button>
                </form>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </AppShell>
  );
}
