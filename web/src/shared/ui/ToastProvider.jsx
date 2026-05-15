import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_THEME = {
  success: {
    title: 'Success',
    border: '#22C55E',
    bg: 'rgba(236, 253, 245, 0.98)',
    text: '#064E3B',
    iconBg: '#22C55E',
    icon: CheckCircle,
  },
  error: {
    title: 'Error',
    border: '#EF4444',
    bg: 'rgba(254, 242, 242, 0.98)',
    text: '#7F1D1D',
    iconBg: '#EF4444',
    icon: XCircle,
  },
  warning: {
    title: 'Warning',
    border: '#F59E0B',
    bg: 'rgba(255, 251, 235, 0.98)',
    text: '#78350F',
    iconBg: '#F59E0B',
    icon: AlertTriangle,
  },
  info: {
    title: 'Info',
    border: '#3B82F6',
    bg: 'rgba(239, 246, 255, 0.98)',
    text: '#1E3A8A',
    iconBg: '#3B82F6',
    icon: Info,
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', title, duration = 3200) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast = { id, message, type, title };
    setToasts(prev => [toast, ...prev]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {toasts.map(t => {
            const theme = TOAST_THEME[t.type] || TOAST_THEME.success;
            const Icon = theme.icon;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    minWidth: 300,
                    maxWidth: 380,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    boxShadow: '0 16px 40px rgba(43,45,66,0.12)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: theme.iconBg,
                      color: '#fff',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: theme.text }}>
                      {t.title || theme.title}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#4B5563' }}>{t.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(t.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 2 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
