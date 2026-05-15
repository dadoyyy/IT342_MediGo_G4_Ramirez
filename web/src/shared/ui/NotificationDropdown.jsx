import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  Activity,
  Check,
} from 'lucide-react';

const ICON_MAP = {
  check:    CheckCircle,
  x:        XCircle,
  clock:    Clock,
  plus:     PlusCircle,
  complete: Activity,
};

function timeAgo(ts) {
  if (!ts) return '';
  const now = Date.now();
  const then = new Date(ts).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * A bell icon + dropdown that shows notifications.
 *
 * Props:
 *  - notifications (array)  — from useNotifications
 *  - unreadCount   (number) — count of unread
 *  - onMarkRead    (fn)     — markRead(id)
 *  - onMarkAllRead (fn)     — markAllRead()
 *  - loading       (bool)
 */
export default function NotificationDropdown({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  loading = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 10,
          background: open ? 'rgba(239,35,60,0.15)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? 'rgba(239,35,60,0.3)' : 'rgba(255,255,255,0.1)'}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          color: open ? '#EF233C' : 'rgba(237,242,244,0.6)',
        }}
      >
        <Bell size={16} />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              borderRadius: 99,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              fontSize: 9,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #EF233C, #D90429)',
              color: '#fff',
              border: '2px solid #2B2D42',
              lineHeight: 1,
              boxShadow: '0 2px 8px rgba(239,35,60,0.4)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 340,
              maxHeight: 440,
              zIndex: 200,
              background: '#FFFFFF',
              border: '1px solid rgba(43,45,66,0.1)',
              borderRadius: 16,
              boxShadow:
                '0 20px 60px rgba(0,0,0,0.1), 0 0 30px rgba(239,35,60,0.06)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px 12px',
                borderBottom: '1px solid rgba(43,45,66,0.07)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 99,
                      background: 'rgba(239,35,60,0.12)',
                      color: '#EF233C',
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => { onMarkAllRead?.(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(239,35,60,0.7)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <Check size={11} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(43,45,66,0.15) transparent',
              }}
            >
              {loading ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '40px 0',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: 'rgba(239,35,60,0.2)',
                      borderTopColor: '#EF233C',
                    }}
                  />
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      background: 'rgba(43,45,66,0.06)',
                      border: '1px solid rgba(43,45,66,0.06)',
                    }}
                  >
                    <Bell
                      size={18}
                      style={{ color: 'rgba(43,45,66,0.3)' }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(43,45,66,0.5)',
                      margin: '0 0 4px',
                    }}
                  >
                    No notifications yet
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'rgba(43,45,66,0.4)',
                      margin: 0,
                    }}
                  >
                    We'll notify you about appointments
                  </p>
                </div>
              ) : (
                notifications.map((n, i) => {
                  const IconComp = ICON_MAP[n.icon] || Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.read) onMarkRead?.(n.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        width: '100%',
                        padding: '12px 16px',
                        background: n.read
                          ? 'transparent'
                          : 'rgba(239,35,60,0.03)',
                        border: 'none',
                        borderBottom:
                          i < notifications.length - 1
                            ? '1px solid rgba(43,45,66,0.04)'
                            : 'none',
                        cursor: n.read ? 'default' : 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!n.read)
                          e.currentTarget.style.background =
                            'rgba(239,35,60,0.06)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = n.read
                          ? 'transparent'
                          : 'rgba(239,35,60,0.03)';
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          background: `${n.color}15`,
                          border: `1px solid ${n.color}25`,
                        }}
                      >
                        <IconComp
                          size={14}
                          style={{ color: n.color || '#8892A4' }}
                        />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 2,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: n.read ? 500 : 700,
                              color: n.read
                                ? 'rgba(43,45,66,0.7)'
                                : '#2B2D42',
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {n.title}
                          </span>
                          {!n.read && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#EF233C',
                                flexShrink: 0,
                                boxShadow: '0 0 6px rgba(239,35,60,0.5)',
                              }}
                            />
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: 'rgba(43,45,66,0.6)',
                            margin: '0 0 3px',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {n.message}
                        </p>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'rgba(43,45,66,0.4)',
                          }}
                        >
                          {timeAgo(n.time)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
