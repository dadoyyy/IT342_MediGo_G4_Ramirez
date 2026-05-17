import { useState, useEffect, useCallback, useRef } from 'react';
import { appointmentApi } from '../api/api';

const LS_KEY = 'medigo_read_notifications';

/**
 * Derive user-facing notifications from existing appointment data.
 * No backend notification API needed — we poll appointments and transform them.
 */
export default function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevSnapshotRef = useRef(null);

  // Get set of read notification IDs from localStorage
  function getReadIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
    } catch {
      return new Set();
    }
  }

  function markRead(id) {
    const readIds = getReadIds();
    readIds.add(id);
    localStorage.setItem(LS_KEY, JSON.stringify([...readIds]));
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function markAllRead() {
    const allIds = notifications.map(n => n.id);
    const readIds = getReadIds();
    allIds.forEach(id => readIds.add(id));
    localStorage.setItem(LS_KEY, JSON.stringify([...readIds]));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await appointmentApi.listMine();
      const list = res.data?.data ?? res.data;
      if (!Array.isArray(list)) return;

      const readIds = getReadIds();
      const derived = [];

      const role = user.role || 'PATIENT';

      for (const appt of list) {
        const ts = appt.updatedAt || appt.createdAt || appt.appointmentAt;

        if (role === 'PATIENT') {
          // Patients get notified about status changes
          if (appt.status === 'CONFIRMED') {
            const id = `appt-confirmed-${appt.id}`;
            derived.push({
              id,
              type: 'appointment_confirmed',
              title: 'Appointment Confirmed',
              message: `Your appointment with Dr. ${appt.doctorName || 'your doctor'} has been confirmed.`,
              time: ts,
              read: readIds.has(id),
              icon: 'check',
              color: '#2EC4B6',
            });
          }
          if (appt.status === 'REJECTED') {
            const id = `appt-rejected-${appt.id}`;
            derived.push({
              id,
              type: 'appointment_rejected',
              title: 'Appointment Rejected',
              message: `Your appointment with Dr. ${appt.doctorName || 'your doctor'} was declined.`,
              time: ts,
              read: readIds.has(id),
              icon: 'x',
              color: '#FF7A59',
            });
          }
          if (appt.status === 'COMPLETED') {
            const id = `appt-completed-${appt.id}`;
            derived.push({
              id,
              type: 'appointment_completed',
              title: 'Appointment Completed',
              message: `Your visit with Dr. ${appt.doctorName || 'your doctor'} is marked complete.`,
              time: ts,
              read: readIds.has(id),
              icon: 'complete',
              color: '#86EFAC',
            });
          }
          if (appt.status === 'PENDING_DOCTOR_APPROVAL') {
            const id = `appt-pending-${appt.id}`;
            derived.push({
              id,
              type: 'appointment_pending',
              title: 'Appointment Requested',
              message: `Waiting for Dr. ${appt.doctorName || 'your doctor'} to confirm your appointment.`,
              time: ts,
              read: readIds.has(id),
              icon: 'clock',
              color: '#FCD34D',
            });
          }
        }

        if (role === 'DOCTOR') {
          // Doctors get notified about new requests and cancellations
          if (appt.status === 'PENDING_DOCTOR_APPROVAL') {
            const id = `doc-new-${appt.id}`;
            derived.push({
              id,
              type: 'new_appointment_request',
              title: 'New Appointment Request',
              message: `${appt.patientName || 'A patient'} requested an appointment.`,
              time: ts,
              read: readIds.has(id),
              icon: 'plus',
              color: '#9B8CFF',
            });
          }
          if (appt.status === 'CANCELLED') {
            const id = `doc-cancel-${appt.id}`;
            derived.push({
              id,
              type: 'appointment_cancelled',
              title: 'Appointment Cancelled',
              message: `${appt.patientName || 'A patient'} cancelled their appointment.`,
              time: ts,
              read: readIds.has(id),
              icon: 'x',
              color: '#FF7A59',
            });
          }
          if (appt.status === 'CONFIRMED') {
            const id = `doc-confirmed-${appt.id}`;
            derived.push({
              id,
              type: 'appointment_confirmed',
              title: 'Appointment Confirmed',
              message: `Appointment with ${appt.patientName || 'a patient'} is confirmed.`,
              time: ts,
              read: readIds.has(id),
              icon: 'check',
              color: '#2EC4B6',
            });
          }
        }
      }

      // Sort by time descending (newest first)
      derived.sort((a, b) => {
        const ta = a.time ? new Date(a.time).getTime() : 0;
        const tb = b.time ? new Date(b.time).getTime() : 0;
        return tb - ta;
      });

      // Limit to most recent 30
      setNotifications(derived.slice(0, 30));
    } catch {
      // silently fail — no notifications is fine
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
  };
}
