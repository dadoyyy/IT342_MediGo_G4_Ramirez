import { useMemo, useState } from 'react';

const RED = '#7C2327';

const DEMO_PENDING = [
  { id: 1, name: 'Dr. Maria Sarafat', license: 'PRC-2026-111', submitted: '2026-04-10' },
  { id: 2, name: 'Dr. Jhon Deo', license: 'PRC-2026-314', submitted: '2026-04-12' },
];

export default function AdminVerification() {
  const [selected, setSelected] = useState(null);

  const selectedRow = useMemo(() => DEMO_PENDING.find((item) => item.id === selected), [selected]);

  return (
    <div className="min-h-screen bg-[#f7f3f3] p-4 md:p-6 lg:p-8">
      <div className="min-h-[80vh] grid md:grid-cols-[220px_1fr] gap-4">
        <aside className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="text-sm font-semibold text-slate-800">Admin Navigation</div>
          {['Dashboard', 'Pending Approvals', 'User Management'].map((item) => (
            <button
              key={item}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border ${item === 'Pending Approvals' ? 'text-white border-transparent' : 'border-slate-200 bg-white text-slate-700'}`}
              style={item === 'Pending Approvals' ? { backgroundColor: RED } : undefined}
            >
              {item}
            </button>
          ))}
        </aside>

        <section className="bg-white border border-slate-200 rounded-2xl p-4">
          <h1 className="text-xl font-bold text-slate-800">Pending Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review submitted doctor profiles and verify credentials.</p>

          <div className="mt-4 overflow-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2">Doctor Name</th>
                  <th className="text-left px-3 py-2">License Number</th>
                  <th className="text-left px-3 py-2">Submitted Date</th>
                  <th className="text-left px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_PENDING.map((row) => (
                  <tr key={row.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.license}</td>
                    <td className="px-3 py-2">{row.submitted}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => setSelected(row.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: RED }}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedRow && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-800">Verification Detail</h2>
            <p className="text-sm text-slate-500 mt-1">{selectedRow.name}</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">Uploaded PRC ID</p>
                <div className="mt-2 h-32 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-500">PRC ID Preview Area</div>
              </div>
              <input defaultValue={selectedRow.license} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setSelected(null)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold">Close</button>
              <button className="px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#14532d' }}>Approve</button>
              <button className="px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: RED }}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
