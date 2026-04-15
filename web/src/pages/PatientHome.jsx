import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { doctorApi } from '../api/api';

const RED = '#7C2327';

function friendlyError(err, fallback) {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || fallback;
  }
  return fallback;
}

export default function PatientHome() {
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDoctors('');
  }, []);

  async function fetchDoctors(search) {
    setLoading(true);
    setError('');
    try {
      const res = await doctorApi.search(search);
      setDoctors(res.data.data || []);
    } catch (err) {
      setError(friendlyError(err, 'Unable to load doctors right now.'));
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchDoctors(query.trim());
  }

  const specialties = useMemo(() => {
    const all = Array.from(new Set(doctors.map((d) => d.specialization))).filter(Boolean);
    return ['ALL', ...all];
  }, [doctors]);

  const locations = useMemo(() => {
    const all = Array.from(new Set(doctors.map((d) => d.clinicAddress))).filter(Boolean);
    return ['ALL', ...all];
  }, [doctors]);

  const filteredDoctors = useMemo(() => (
    doctors.filter((d) => {
      const specialtyMatch = specialty === 'ALL' || d.specialization === specialty;
      const locationMatch = location === 'ALL' || d.clinicAddress === location;
      return specialtyMatch && locationMatch;
    })
  ), [doctors, specialty, location]);

  return (
    <div className="min-h-screen bg-[#f7f3f3] px-4 py-6 md:px-6 lg:px-8">
      <header className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: RED }}>
            MG
          </div>
          <h1 className="text-xl font-bold text-slate-800">Patient Home</h1>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors"
            className="w-full md:w-72 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: RED }}>
            Search
          </button>
          <Link to="/appointments" className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold bg-white hover:bg-slate-50">
            My Appointments
          </Link>
        </form>
      </header>

      <section className="mt-4 bg-white border border-slate-200 rounded-2xl p-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Specialty</label>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {specialties.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All Specialties' : item}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {locations.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All Locations' : item}</option>)}
            </select>
          </div>
        </div>
      </section>

      {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{error}</div>}

      <section className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && <p className="text-sm text-slate-500">Loading doctors...</p>}

        {!loading && filteredDoctors.map((doctor) => (
          <article key={doctor.doctorId} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: RED }}>
                {doctor.doctorName?.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{doctor.doctorName}</h3>
                <p className="text-sm text-slate-600">{doctor.specialization}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">{doctor.clinicName}</p>
                <p className="text-xs text-slate-500 truncate">{doctor.clinicAddress}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Link to={`/doctor/${doctor.doctorId}`} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: RED }}>
                Book Now
              </Link>
              <Link to="/chat" className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50">
                Message
              </Link>
            </div>
          </article>
        ))}

        {!loading && !filteredDoctors.length && (
          <p className="text-sm text-slate-500">No doctors matched your filters.</p>
        )}
      </section>
    </div>
  );
}
