import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authApi, doctorApi, appointmentApi } from '../api/api';
import { authSession } from '../session/authSession';
import { authEvents } from '../patterns/observer/authEventBus';

const APPOINTMENT_TYPES = ['Initial Check-up', 'Follow-up', 'Consultation', 'Vaccination'];

const STATUS_STYLE = {
  PENDING_DOCTOR_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  COMPLETED: 'bg-stone-100 text-stone-700 border-stone-200',
};

const RED = {
  base: '#9E2C32',
  dark: '#7C2327',
  soft: '#FDECEC',
  border: '#F4C9CC',
  ink: '#2E1A1A',
};

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function toApiDateTime(value) {
  if (!value) return '';
  return `${value}:00`;
}

function formatStatus(status) {
  return (status || '').replaceAll('_', ' ').toLowerCase();
}

function formatDateLabel(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function friendlyError(err, fallback) {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || fallback;
  }
  return fallback;
}

function initials(fullName) {
  if (!fullName) return 'MG';
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

function NavButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition border ${
        active
          ? 'text-white border-transparent shadow-sm'
          : 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
      style={active ? { backgroundColor: RED.base } : undefined}
    >
      {label}
    </button>
  );
}

function StatCard({ title, value, detail }) {
  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl md:text-3xl font-bold mt-1" style={{ color: RED.ink }}>{value}</p>
      <p className="text-xs text-slate-500 mt-2">{detail}</p>
    </article>
  );
}

function AppointmentCard({
  appointment,
  isPatient,
  isDoctor,
  onEdit,
  onCancel,
  onDelete,
  onStatus,
}) {
  return (
    <article className="border border-slate-200 rounded-xl p-3.5 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">{appointment.appointmentType}</p>
          <p className="text-sm text-slate-600 mt-0.5">{new Date(appointment.appointmentAt).toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">
            {isPatient ? `Doctor: ${appointment.doctorName}` : `Patient: ${appointment.patientName}`}
          </p>
          {!!appointment.notes && <p className="text-xs text-slate-500 mt-1">Notes: {appointment.notes}</p>}
        </div>
        <span
          className={`text-xs border rounded-full px-2 py-0.5 capitalize ${STATUS_STYLE[appointment.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
        >
          {formatStatus(appointment.status)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {isPatient && ['PENDING_DOCTOR_APPROVAL', 'CONFIRMED'].includes(appointment.status) && (
          <>
            <button onClick={() => onEdit(appointment)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">
              Edit
            </button>
            <button
              onClick={() => onCancel(appointment.id)}
              className="px-3 py-1.5 text-xs border rounded-lg"
              style={{ borderColor: RED.border, backgroundColor: RED.soft, color: RED.base }}
            >
              Cancel
            </button>
          </>
        )}

        {isPatient && appointment.status === 'CANCELLED' && (
          <button onClick={() => onDelete(appointment.id)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">
            Delete Record
          </button>
        )}

        {isDoctor && appointment.status === 'PENDING_DOCTOR_APPROVAL' && (
          <>
            <button onClick={() => onStatus(appointment.id, 'CONFIRMED')} className="px-3 py-1.5 text-xs border border-emerald-300 text-emerald-700 bg-emerald-50 rounded-lg">
              Accept
            </button>
            <button
              onClick={() => onStatus(appointment.id, 'REJECTED')}
              className="px-3 py-1.5 text-xs border rounded-lg"
              style={{ borderColor: RED.border, backgroundColor: RED.soft, color: RED.base }}
            >
              Reject
            </button>
          </>
        )}

        {isDoctor && appointment.status === 'CONFIRMED' && (
          <button onClick={() => onStatus(appointment.id, 'COMPLETED')} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">
            Mark Completed
          </button>
        )}
      </div>
    </article>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [banner, setBanner] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentAt: '',
    appointmentType: APPOINTMENT_TYPES[0],
    notes: '',
  });

  const [editingAppointmentId, setEditingAppointmentId] = useState(null);

  const [doctorProfileForm, setDoctorProfileForm] = useState({
    specialization: '',
    clinicName: '',
    clinicAddress: '',
  });

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';

  const upcomingAppointments = useMemo(
    () => appointments
      .filter((a) => !['CANCELLED', 'COMPLETED', 'REJECTED'].includes(a.status))
      .sort((a, b) => new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime()),
    [appointments],
  );

  const pastAppointments = useMemo(
    () => appointments
      .filter((a) => ['CANCELLED', 'COMPLETED', 'REJECTED'].includes(a.status))
      .sort((a, b) => new Date(b.appointmentAt).getTime() - new Date(a.appointmentAt).getTime()),
    [appointments],
  );

  const todayKey = useMemo(() => new Date().toDateString(), []);

  const doctorRequests = useMemo(
    () => appointments
      .filter((a) => a.status === 'PENDING_DOCTOR_APPROVAL')
      .sort((a, b) => new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime()),
    [appointments],
  );

  const doctorTodaySchedule = useMemo(
    () => appointments
      .filter((a) => {
        const appointmentDate = new Date(a.appointmentAt);
        return appointmentDate.toDateString() === todayKey
          && ['PENDING_DOCTOR_APPROVAL', 'CONFIRMED'].includes(a.status);
      })
      .sort((a, b) => new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime()),
    [appointments, todayKey],
  );

  const doctorUpcomingByDate = useMemo(() => {
    const grouped = new Map();
    appointments
      .filter((a) => {
        const appointmentDate = new Date(a.appointmentAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return appointmentDate >= today
          && ['PENDING_DOCTOR_APPROVAL', 'CONFIRMED'].includes(a.status);
      })
      .sort((a, b) => new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime())
      .forEach((appointment) => {
        const key = new Date(appointment.appointmentAt).toDateString();
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key).push(appointment);
      });
    return Array.from(grouped.entries());
  }, [appointments]);

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === 'PENDING_DOCTOR_APPROVAL').length,
    [appointments],
  );

  const confirmedCount = useMemo(
    () => appointments.filter((a) => a.status === 'CONFIRMED').length,
    [appointments],
  );

  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === 'COMPLETED').length,
    [appointments],
  );

  const navItems = isDoctor
    ? [
        { id: 'overview', label: 'Dashboard' },
        { id: 'requests', label: 'Appointment Requests' },
        { id: 'schedule', label: 'Schedule' },
        { id: 'messages', label: 'Messages' },
        { id: 'profile', label: 'Professional Profile' },
        { id: 'settings', label: 'Settings' },
      ]
    : [
        { id: 'overview', label: 'Dashboard' },
        { id: 'find-doctors', label: 'Find Doctors' },
        { id: 'book', label: 'Book Appointment' },
        { id: 'appointments', label: 'My Appointments' },
        { id: 'messages', label: 'Messages' },
        { id: 'profile', label: 'Profile' },
        { id: 'settings', label: 'Settings' },
      ];

  useEffect(() => {
    const unsubscribe = authEvents.subscribe(authEvents.names.sessionExpired, () => {
      navigate('/login', { replace: true });
    });
    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (isDoctor) {
      if (!['overview', 'requests', 'schedule', 'messages', 'profile', 'settings'].includes(activeSection)) {
        setActiveSection('overview');
      }
    } else if (isPatient) {
      if (!['overview', 'find-doctors', 'book', 'appointments', 'messages', 'profile', 'settings'].includes(activeSection)) {
        setActiveSection('overview');
      }
    }
  }, [isDoctor, isPatient, activeSection]);

  useEffect(() => {
    if (activeSection === 'messages') {
      navigate('/chat');
    }
  }, [activeSection, navigate]);

  async function bootstrap() {
    setLoading(true);
    setGlobalError('');
    try {
      const meRes = await authApi.me();
      const currentUser = meRes.data.data;
      setUser(currentUser);

      await refreshAppointments();

      if (currentUser.role === 'PATIENT') {
        await searchDoctors('');
      }
      if (currentUser.role === 'DOCTOR') {
        await loadDoctorProfile();
      }
    } catch (err) {
      setGlobalError(friendlyError(err, 'Failed to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }

  async function refreshAppointments() {
    setListLoading(true);
    try {
      const res = await appointmentApi.listMine();
      setAppointments(res.data.data || []);
    } catch (err) {
      setBanner(friendlyError(err, 'Unable to load appointments right now.'));
    } finally {
      setListLoading(false);
    }
  }

  async function searchDoctors(searchValue) {
    setDoctorLoading(true);
    try {
      const res = await doctorApi.search(searchValue);
      setDoctors(res.data.data || []);
    } catch (err) {
      setBanner(friendlyError(err, 'Failed to load available doctors.'));
    } finally {
      setDoctorLoading(false);
    }
  }

  async function loadDoctorProfile() {
    try {
      const res = await doctorApi.getMyProfile();
      const data = res.data.data;
      setDoctorProfileForm({
        specialization: data.specialization || '',
        clinicName: data.clinicName || '',
        clinicAddress: data.clinicAddress || '',
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return;
      setBanner(friendlyError(err, 'Failed to load your doctor profile.'));
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // proceed with local cleanup
    }
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout, { source: 'dashboard' });
    navigate('/login', { replace: true });
  }

  async function handleDoctorSearchSubmit(e) {
    e.preventDefault();
    await searchDoctors(query.trim());
  }

  async function submitAppointment(e) {
    e.preventDefault();
    setBanner('');

    if (!selectedDoctorId) {
      setBanner('Please choose a doctor before booking.');
      return;
    }

    if (!appointmentForm.appointmentAt) {
      setBanner('Please select appointment date and time.');
      return;
    }

    try {
      if (editingAppointmentId) {
        await appointmentApi.update(editingAppointmentId, {
          appointmentAt: toApiDateTime(appointmentForm.appointmentAt),
          appointmentType: appointmentForm.appointmentType,
          notes: appointmentForm.notes || '',
        });
        setBanner('Appointment updated successfully.');
      } else {
        await appointmentApi.create({
          doctorId: Number(selectedDoctorId),
          appointmentAt: toApiDateTime(appointmentForm.appointmentAt),
          appointmentType: appointmentForm.appointmentType,
          notes: appointmentForm.notes || '',
        });
        setBanner('Appointment requested successfully. Waiting for doctor approval.');
      }

      setEditingAppointmentId(null);
      setAppointmentForm({ appointmentAt: '', appointmentType: APPOINTMENT_TYPES[0], notes: '' });
      await refreshAppointments();
      setActiveSection('appointments');
    } catch (err) {
      setBanner(friendlyError(err, 'Unable to save appointment.'));
    }
  }

  function startEdit(appointment) {
    setEditingAppointmentId(appointment.id);
    setSelectedDoctorId(String(appointment.doctorId));
    setAppointmentForm({
      appointmentAt: toInputDateTime(appointment.appointmentAt),
      appointmentType: appointment.appointmentType,
      notes: appointment.notes || '',
    });
    setActiveSection('book');
  }

  async function cancelAppointment(id) {
    try {
      await appointmentApi.cancel(id);
      setBanner('Appointment cancelled successfully.');
      await refreshAppointments();
    } catch (err) {
      setBanner(friendlyError(err, 'Unable to cancel appointment.'));
    }
  }

  async function deleteAppointment(id) {
    try {
      await appointmentApi.delete(id);
      setBanner('Cancelled appointment removed.');
      await refreshAppointments();
    } catch (err) {
      setBanner(friendlyError(err, 'Unable to delete appointment.'));
    }
  }

  async function updateDoctorAppointmentStatus(id, status) {
    try {
      await appointmentApi.updateStatus(id, { status });
      setBanner(`Appointment marked as ${formatStatus(status)}.`);
      await refreshAppointments();
    } catch (err) {
      setBanner(friendlyError(err, 'Unable to update appointment status.'));
    }
  }

  async function saveDoctorProfile(e) {
    e.preventDefault();
    setBanner('');

    if (!doctorProfileForm.specialization.trim() || !doctorProfileForm.clinicName.trim() || !doctorProfileForm.clinicAddress.trim()) {
      setBanner('Please complete specialization, clinic name, and clinic address.');
      return;
    }

    try {
      await doctorApi.upsertMyProfile({
        specialization: doctorProfileForm.specialization.trim(),
        clinicName: doctorProfileForm.clinicName.trim(),
        clinicAddress: doctorProfileForm.clinicAddress.trim(),
      });
      setBanner('Professional profile saved successfully.');
      await loadDoctorProfile();
    } catch (err) {
      setBanner(friendlyError(err, 'Unable to save doctor profile.'));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f3f3] flex items-center justify-center">
        <p className="text-sm text-slate-600">Loading your dashboard...</p>
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="min-h-screen bg-[#f7f3f3] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border px-4 py-3 text-sm" style={{ borderColor: RED.border, backgroundColor: RED.soft, color: RED.base }}>
          {globalError}
        </div>
      </div>
    );
  }

  const patientOverview = (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Appointments" value={appointments.length} detail="Since your account was created" />
        <StatCard title="Pending Approval" value={pendingCount} detail="Waiting for doctor response" />
        <StatCard title="Confirmed Visits" value={confirmedCount} detail="Upcoming consultations" />
      </div>

      <div className="grid xl:grid-cols-[1.2fr,1fr] gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Upcoming Appointments</h3>
            <button onClick={() => setActiveSection('appointments')} className="text-xs font-semibold" style={{ color: RED.base }}>
              See All
            </button>
          </div>
          <div className="space-y-2">
            {upcomingAppointments.slice(0, 3).map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isPatient
                isDoctor={false}
                onEdit={startEdit}
                onCancel={cancelAppointment}
                onDelete={deleteAppointment}
                onStatus={updateDoctorAppointmentStatus}
              />
            ))}
            {!upcomingAppointments.length && <p className="text-sm text-slate-500">No upcoming appointments yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ borderColor: RED.border, backgroundColor: '#fff7f7' }}>
          <h3 className="font-semibold" style={{ color: RED.ink }}>Quick Actions</h3>
          <p className="text-sm text-slate-600 mt-1">Book with verified doctors and manage your schedules.</p>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => setActiveSection('find-doctors')}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: RED.base }}
            >
              Find Doctor
            </button>
            <button
              onClick={() => setActiveSection('book')}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold border"
              style={{ borderColor: RED.border, color: RED.base, backgroundColor: '#fff' }}
            >
              New Booking
            </button>
            <button
              onClick={() => setActiveSection('profile')}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold border"
              style={{ borderColor: RED.border, color: RED.base, backgroundColor: '#fff' }}
            >
              View My Profile
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  const doctorOverview = (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Today's Queue" value={upcomingAppointments.length} detail="Pending and confirmed visits" />
        <StatCard title="Pending Requests" value={pendingCount} detail="Require your review" />
        <StatCard title="Completed Visits" value={completedCount} detail="Finished consultations" />
      </div>

      <div className="grid xl:grid-cols-[1.4fr,1fr] gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Patient Requests</h3>
            <button onClick={() => setActiveSection('requests')} className="text-xs font-semibold" style={{ color: RED.base }}>
              Manage
            </button>
          </div>
          <div className="space-y-2">
            {doctorRequests.slice(0, 4).map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  isPatient={false}
                  isDoctor
                  onEdit={startEdit}
                  onCancel={cancelAppointment}
                  onDelete={deleteAppointment}
                  onStatus={updateDoctorAppointmentStatus}
                />
              ))}
            {!pendingCount && <p className="text-sm text-slate-500">No pending requests.</p>}
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ borderColor: RED.border, backgroundColor: '#fff7f7' }}>
          <h3 className="font-semibold" style={{ color: RED.ink }}>Doctor Workspace</h3>
          <p className="text-sm text-slate-600 mt-1">Keep profile details updated so patients can discover you.</p>
          <button
            onClick={() => setActiveSection('profile')}
            className="w-full mt-4 rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: RED.base }}
          >
            Update Professional Profile
          </button>
        </div>
      </div>
    </section>
  );

  const doctorRequestsPanel = (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Appointment Requests</h2>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: RED.soft, color: RED.base }}>
          {doctorRequests.length} pending
        </span>
      </div>
      <p className="text-sm text-slate-500 mt-1">Review incoming requests and respond quickly.</p>

      <div className="mt-4 space-y-2">
        {doctorRequests.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            isPatient={false}
            isDoctor
            onEdit={startEdit}
            onCancel={cancelAppointment}
            onDelete={deleteAppointment}
            onStatus={updateDoctorAppointmentStatus}
          />
        ))}
        {!doctorRequests.length && <p className="text-sm text-slate-500">No pending requests right now.</p>}
      </div>
    </section>
  );

  const doctorSchedulePanel = (
    <section className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="Today Total" value={doctorTodaySchedule.length} detail="Pending and confirmed today" />
        <StatCard title="Pending Today" value={doctorTodaySchedule.filter((a) => a.status === 'PENDING_DOCTOR_APPROVAL').length} detail="Need confirmation" />
        <StatCard title="Confirmed Today" value={doctorTodaySchedule.filter((a) => a.status === 'CONFIRMED').length} detail="Ready for consultation" />
      </div>

      <div className="grid xl:grid-cols-[1fr,1.1fr] gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800">Today Timeline</h3>
          <p className="text-sm text-slate-500 mt-1">Current day appointments in chronological order.</p>
          <div className="mt-4 space-y-2">
            {doctorTodaySchedule.map((appointment) => (
              <div key={appointment.id} className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{new Date(appointment.appointmentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {appointment.patientName}</p>
                    <p className="text-xs text-slate-500">{appointment.appointmentType}</p>
                  </div>
                  <span className={`text-xs border rounded-full px-2 py-0.5 capitalize ${STATUS_STYLE[appointment.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {formatStatus(appointment.status)}
                  </span>
                </div>
              </div>
            ))}
            {!doctorTodaySchedule.length && <p className="text-sm text-slate-500">No schedule entries for today.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800">Upcoming Schedule</h3>
          <p className="text-sm text-slate-500 mt-1">Grouped by date for quick planning.</p>
          <div className="mt-4 space-y-4 max-h-[540px] overflow-auto pr-1">
            {doctorUpcomingByDate.map(([dateKey, items]) => (
              <div key={dateKey}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: RED.base }}>
                  {formatDateLabel(items[0].appointmentAt)}
                </p>
                <div className="space-y-2">
                  {items.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      isPatient={false}
                      isDoctor
                      onEdit={startEdit}
                      onCancel={cancelAppointment}
                      onDelete={deleteAppointment}
                      onStatus={updateDoctorAppointmentStatus}
                    />
                  ))}
                </div>
              </div>
            ))}
            {!doctorUpcomingByDate.length && <p className="text-sm text-slate-500">No upcoming scheduled consultations.</p>}
          </div>
        </div>
      </div>
    </section>
  );

  const patientFindDoctors = (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="text-lg font-semibold text-slate-800">Find Verified Doctors</h2>
      <p className="text-sm text-slate-500 mt-1">Search by doctor name, specialization, or clinic.</p>

      <form onSubmit={handleDoctorSearchSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search doctor, specialization, clinic"
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: RED.base }}
        >
          Search
        </button>
      </form>

      <div className="mt-4 grid md:grid-cols-2 gap-3">
        {doctorLoading && <p className="text-sm text-slate-500">Loading doctors...</p>}
        {!doctorLoading && !doctors.length && <p className="text-sm text-slate-500">No verified doctors found for this search.</p>}

        {doctors.map((doctor) => (
          <button
            key={doctor.doctorId}
            type="button"
            onClick={() => {
              setSelectedDoctorId(String(doctor.doctorId));
              setActiveSection('book');
            }}
            className={`text-left rounded-xl border p-3 transition ${
              selectedDoctorId === String(doctor.doctorId)
                ? 'bg-rose-50 border-rose-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="font-semibold text-slate-800">{doctor.doctorName}</p>
            <p className="text-sm text-slate-600 mt-0.5">{doctor.specialization}</p>
            <p className="text-xs text-slate-500 mt-1">{doctor.clinicName} | {doctor.clinicAddress}</p>
          </button>
        ))}
      </div>
    </section>
  );

  const patientBookingForm = (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="text-lg font-semibold text-slate-800">{editingAppointmentId ? 'Update Appointment' : 'Book Appointment'}</h2>
      <p className="text-sm text-slate-500 mt-1">Fill in your preferred schedule and submit your request.</p>

      <form onSubmit={submitAppointment} className="mt-4 grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Choose a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.doctorName} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Appointment Date & Time</label>
            <input
              type="datetime-local"
              value={appointmentForm.appointmentAt}
              min={toInputDateTime(new Date())}
              onChange={(e) => setAppointmentForm((prev) => ({ ...prev, appointmentAt: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Appointment Type</label>
            <select
              value={appointmentForm.appointmentType}
              onChange={(e) => setAppointmentForm((prev) => ({ ...prev, appointmentType: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {APPOINTMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Notes (Optional)</label>
          <textarea
            value={appointmentForm.notes}
            onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={8}
            maxLength={1000}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Add symptoms or details for your doctor"
          />
        </div>

        <div className="lg:col-span-2 flex flex-wrap gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: RED.base }}
          >
            {editingAppointmentId ? 'Update Appointment' : 'Request Booking'}
          </button>

          {editingAppointmentId && (
            <button
              type="button"
              onClick={() => {
                setEditingAppointmentId(null);
                setAppointmentForm({ appointmentAt: '', appointmentType: APPOINTMENT_TYPES[0], notes: '' });
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );

  const appointmentsPanel = (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">My Appointments</h2>
        <button onClick={refreshAppointments} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">
          Refresh
        </button>
      </div>

      {listLoading ? (
        <p className="text-sm text-slate-500 mt-4">Loading appointments...</p>
      ) : (
        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Upcoming</h3>
            <div className="space-y-2">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  isPatient={isPatient}
                  isDoctor={isDoctor}
                  onEdit={startEdit}
                  onCancel={cancelAppointment}
                  onDelete={deleteAppointment}
                  onStatus={updateDoctorAppointmentStatus}
                />
              ))}
              {!upcomingAppointments.length && <p className="text-sm text-slate-500">No upcoming appointments.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Past / Cancelled</h3>
            <div className="space-y-2">
              {pastAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  isPatient={isPatient}
                  isDoctor={isDoctor}
                  onEdit={startEdit}
                  onCancel={cancelAppointment}
                  onDelete={deleteAppointment}
                  onStatus={updateDoctorAppointmentStatus}
                />
              ))}
              {!pastAppointments.length && <p className="text-sm text-slate-500">No past or cancelled appointments.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const doctorProfilePanel = (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="text-lg font-semibold text-slate-800">Professional Profile</h2>
      <p className="text-sm text-slate-500 mt-1">Keep this updated for patient discovery and booking trust.</p>

      <form onSubmit={saveDoctorProfile} className="mt-4 grid md:grid-cols-3 gap-3">
        <input
          value={doctorProfileForm.specialization}
          onChange={(e) => setDoctorProfileForm((prev) => ({ ...prev, specialization: e.target.value }))}
          placeholder="Specialization"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={doctorProfileForm.clinicName}
          onChange={(e) => setDoctorProfileForm((prev) => ({ ...prev, clinicName: e.target.value }))}
          placeholder="Clinic Name"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={doctorProfileForm.clinicAddress}
          onChange={(e) => setDoctorProfileForm((prev) => ({ ...prev, clinicAddress: e.target.value }))}
          placeholder="Clinic Address"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <div className="md:col-span-3">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: RED.base }}
          >
            Save Profile
          </button>
        </div>
      </form>
    </section>
  );

  const patientProfilePanel = (
    <section className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: RED.base }}>
            {initials(user?.fullName)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{user?.fullName}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs mt-1 uppercase tracking-wide" style={{ color: RED.base }}>
              {formatStatus(user?.role)} account
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="Total Bookings" value={appointments.length} detail="All appointment records" />
        <StatCard title="Active Requests" value={upcomingAppointments.length} detail="Pending and confirmed" />
        <StatCard title="Completed Visits" value={completedCount} detail="Consultations done" />
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800">Recent Appointment Activity</h3>
        <p className="text-sm text-slate-500 mt-1">Your latest records and statuses.</p>
        <div className="mt-4 space-y-2">
          {appointments.slice(0, 5).map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              isPatient
              isDoctor={false}
              onEdit={startEdit}
              onCancel={cancelAppointment}
              onDelete={deleteAppointment}
              onStatus={updateDoctorAppointmentStatus}
            />
          ))}
          {!appointments.length && <p className="text-sm text-slate-500">No appointment activity yet.</p>}
        </div>
      </section>
    </section>
  );

  const settingsPanel = (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
      <p className="text-sm text-slate-500 mt-1">General account actions for this dashboard.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={refreshAppointments} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
          Refresh Data
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm rounded-lg border"
          style={{ borderColor: RED.border, backgroundColor: RED.soft, color: RED.base }}
        >
          Sign Out
        </button>
      </div>
    </section>
  );

  let currentPanel = isDoctor ? doctorOverview : patientOverview;
  if (isPatient && activeSection === 'find-doctors') currentPanel = patientFindDoctors;
  if (isPatient && activeSection === 'book') currentPanel = patientBookingForm;
  if (isPatient && activeSection === 'appointments') currentPanel = appointmentsPanel;
  if (isDoctor && activeSection === 'requests') currentPanel = doctorRequestsPanel;
  if (isDoctor && activeSection === 'schedule') currentPanel = doctorSchedulePanel;
  if (activeSection === 'profile') currentPanel = isDoctor ? doctorProfilePanel : patientProfilePanel;
  if (activeSection === 'settings') currentPanel = settingsPanel;

  return (
    <div className="min-h-screen bg-[#f7f3f3] text-slate-800">
      <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
        <aside className={`fixed md:sticky md:top-0 inset-y-0 left-0 z-40 w-[260px] bg-white border-r border-slate-200 p-4 md:p-5 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center justify-between md:justify-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: RED.base }}>
              {initials(user?.fullName)}
            </div>
            <button className="md:hidden text-sm text-slate-500" onClick={() => setSidebarOpen(false)}>Close</button>
          </div>

          <div className="text-center mt-3">
            <p className="font-semibold text-slate-800">{user?.fullName}</p>
            <p className="text-xs capitalize text-slate-500 mt-0.5">{formatStatus(user?.role)}</p>
          </div>

          <nav className="mt-5 space-y-2">
            {navItems.map((item) => (
              <NavButton
                key={item.id}
                label={item.label}
                active={activeSection === item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
              />
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="w-full mt-4 px-3 py-2.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: RED.border, backgroundColor: RED.soft, color: RED.base }}
          >
            Logout
          </button>
        </aside>

        {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setSidebarOpen(false)} />}

        <section className="min-w-0 p-4 md:p-6 lg:p-7">
          <header className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5 mb-4 flex items-center gap-3 justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: RED.ink }}>Dashboard</h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">Manage appointments, profiles, and healthcare workflows.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctors"
                className="hidden md:block border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={() => setSidebarOpen((value) => !value)}
                className="md:hidden rounded-lg border border-slate-300 px-3 py-2 text-xs"
              >
                Menu
              </button>
            </div>
          </header>

          {banner && (
            <div className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: RED.border, backgroundColor: RED.soft, color: RED.base }}>
              {banner}
            </div>
          )}

          {currentPanel}
        </section>
      </div>
    </div>
  );
}
