import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, XCircle, CheckCircle2, ArrowRight, Stethoscope } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import axios from 'axios';

export default function VerifyEmail() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const verifiedCalled = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    if (verifiedCalled.current) return;
    verifiedCalled.current = true;

    authApi.verifyEmail(token)
      .then(res => {
        setStatus('success');
        setMessage(res.data?.data || 'Your email has been successfully verified.');
      })
      .catch(err => {
        setStatus('error');
        const msg = (axios.isAxiosError(err) && err.response?.data)
          ? (err.response.data?.message || 'Verification failed. The link may be invalid or expired.')
          : 'Unable to connect to the server.';
        setMessage(msg);
      });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#EDF2F4' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 440, borderRadius: 24, padding: 48, background: '#fff', border: '1px solid rgba(43,45,66,0.08)', boxShadow: '0 20px 40px rgba(43,45,66,0.05)', textAlign: 'center' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 24px rgba(239,35,60,0.2)' }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', letterSpacing: '-0.02em' }}>MediGo</span>
        </div>

        {status === 'verifying' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(43,45,66,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <ShieldCheck size={32} className="animate-pulse" style={{ color: '#8D99AE' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', marginBottom: 12 }}>Verifying your email</h2>
            <p style={{ color: '#8D99AE', margin: 0 }}>Please wait while we validate your credentials...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,168,83,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={32} style={{ color: '#34A853' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', marginBottom: 12 }}>Verified!</h2>
            <p style={{ color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>{message}</p>
            <Link to="/login" className="mg-btn w-full" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
              Continue to Login <ArrowRight size={18} />
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,35,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <XCircle size={32} style={{ color: '#EF233C' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', marginBottom: 12 }}>Verification Failed</h2>
            <p style={{ color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>{message}</p>
            <Link to="/register" className="mg-btn-ghost w-full" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
              Back to Registration
            </Link>
          </>
        )}

      </motion.div>
    </div>
  );
}
