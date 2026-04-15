import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { authApi, chatApi } from '../api/api';

const RED = '#7C2327';

function friendlyError(err, fallback) {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || fallback;
  }
  return fallback;
}

function normalizeRole(role) {
  return (role || '').toLowerCase();
}

export default function ChatInterface() {
  const [me, setMe] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactQuery, setContactQuery] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  const activeThread = useMemo(() => contacts.find((t) => t.id === activeId), [contacts, activeId]);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    setLoadingContacts(true);
    setError('');
    try {
      const [meRes, contactsRes] = await Promise.all([
        authApi.me(),
        chatApi.contacts(''),
      ]);
      const currentUser = meRes.data.data;
      const list = contactsRes.data.data || [];
      setMe(currentUser);
      setContacts(list);

      if (list.length) {
        setActiveId(list[0].id);
        await loadConversation(list[0].id);
      }
    } catch (err) {
      setError(friendlyError(err, 'Unable to load chat data.'));
    } finally {
      setLoadingContacts(false);
    }
  }

  async function searchContacts(e) {
    e.preventDefault();
    setLoadingContacts(true);
    setError('');
    try {
      const res = await chatApi.contacts(contactQuery.trim());
      const list = res.data.data || [];
      setContacts(list);
      if (!list.find((c) => c.id === activeId)) {
        setActiveId(list[0]?.id ?? null);
        if (list[0]?.id) {
          await loadConversation(list[0].id);
        } else {
          setMessages([]);
        }
      }
    } catch (err) {
      setError(friendlyError(err, 'Unable to search contacts.'));
    } finally {
      setLoadingContacts(false);
    }
  }

  async function loadConversation(otherUserId) {
    if (!otherUserId) return;
    setLoadingMessages(true);
    setError('');
    try {
      const res = await chatApi.conversation(otherUserId);
      setMessages(res.data.data || []);
    } catch (err) {
      setError(friendlyError(err, 'Unable to load this conversation.'));
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;

    try {
      const res = await chatApi.sendMessage({
        receiverId: activeId,
        content: draft.trim(),
      });
      setMessages((prev) => [...prev, res.data.data]);
      setDraft('');
    } catch (err) {
      setError(friendlyError(err, 'Unable to send message.'));
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f3f3] p-4 md:p-6 lg:p-8">
      <div className="min-h-[80vh] grid md:grid-cols-[260px_1fr] gap-4">
        <aside className="bg-white border border-slate-200 rounded-2xl p-4">
          <h1 className="font-semibold text-slate-800">Chats</h1>
          <form onSubmit={searchContacts} className="mt-3 flex gap-2">
            <input
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="Find contact"
              className="flex-1 border border-slate-300 rounded-lg px-2.5 py-2 text-xs"
            />
            <button type="submit" className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: RED }}>
              Go
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {loadingContacts && <p className="text-xs text-slate-500">Loading contacts...</p>}
            {!loadingContacts && contacts.map((thread) => (
              <button
                key={thread.id}
                onClick={async () => {
                  setActiveId(thread.id);
                  await loadConversation(thread.id);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${activeId === thread.id ? 'text-white border-transparent' : 'border-slate-200 bg-white text-slate-700'}`}
                style={activeId === thread.id ? { backgroundColor: RED } : undefined}
              >
                <p className="font-semibold truncate">{thread.fullName}</p>
                <p className={`text-xs ${activeId === thread.id ? 'text-rose-100' : 'text-slate-500'}`}>
                  {normalizeRole(thread.role)}
                </p>
              </button>
            ))}
            {!loadingContacts && !contacts.length && <p className="text-xs text-slate-500">No available contacts.</p>}
          </div>
        </aside>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="font-semibold text-slate-800">{activeThread?.fullName || 'Select a contact'}</h2>
            <p className="text-xs text-slate-500">
              {activeThread ? `Role: ${normalizeRole(activeThread.role)}` : 'Choose a doctor or allowed contact'}
            </p>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-xs">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-auto py-4 space-y-2">
            {loadingMessages && <p className="text-sm text-slate-500">Loading messages...</p>}
            {!loadingMessages && messages.map((message) => {
              const mine = me && message.senderId === me.id;
              return (
              <div key={message.id} className={`max-w-[78%] px-3 py-2 rounded-xl text-sm ${mine ? 'ml-auto text-white' : 'mr-auto bg-slate-100 text-slate-700'}`} style={mine ? { backgroundColor: RED } : undefined}>
                <p>{message.content}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-rose-100' : 'text-slate-500'}`}>
                  {new Date(message.sentAt).toLocaleString()}
                </p>
              </div>
            );})}
            {!loadingMessages && !messages.length && (
              <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p>
            )}
          </div>

          <form onSubmit={sendMessage} className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your message"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              disabled={!activeId}
            />
            <button type="submit" disabled={!activeId} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: RED }}>
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
