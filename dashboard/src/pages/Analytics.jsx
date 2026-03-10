import { useEffect, useState } from "react";
import { getBookingsPerDay, getPeakSlots, getStatusBreakdown, getRepeatCustomers } from "../api/analytics.js";
import { listHotels } from "../api/hotels.js";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#22d3ee"];
const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

export default function Analytics() {
  const [hotel, setHotel] = useState(null);
  const [range, setRange] = useState(30);
  const [bpd, setBpd] = useState([]);
  const [peak, setPeak] = useState([]);
  const [status, setStatus] = useState([]);
  const [repeat, setRepeat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: hotels } = await listHotels();
      if (hotels.length) setHotel(hotels[0]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!hotel) return;
    const from = new Date(); from.setDate(from.getDate() - range);
    const fromStr = from.toISOString().split("T")[0];
    const toStr = new Date().toISOString().split("T")[0];
    Promise.all([
      getBookingsPerDay({ hotel_id: hotel.id, from: fromStr, to: toStr }),
      getPeakSlots(hotel.id),
      getStatusBreakdown(hotel.id),
      getRepeatCustomers(hotel.id),
    ]).then(([b, p, s, r]) => {
      setBpd(b.data); setPeak(p.data); setStatus(s.data); setRepeat(r.data);
    });
  }, [hotel, range]);

  if (loading) return <div className="text-slate-400 text-center mt-20">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <div className="flex gap-2">
          {RANGES.map(({ label, days }) => (
            <button key={days} onClick={() => setRange(days)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${range === days
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings per day */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Bookings Over Time</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bpd}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1e2535", border: "1px solid #2a3347", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#818cf8" }} />
              <Line type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Peak slots */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Peak Time Slots</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={peak} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="time" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip contentStyle={{ background: "#1e2535", border: "1px solid #2a3347", borderRadius: 8 }} />
              <Bar dataKey="bookings" fill="#22d3ee" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Bookings by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={75}
                innerRadius={45} paddingAngle={3} label={({ status: s, count }) => `${s}: ${count}`}
                labelLine={false}>
                {status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Repeat customers */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Repeat Customers</h2>
          {repeat.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No repeat customers yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#2a3347]">
                <th className="text-left px-2 py-2 text-slate-500">Name</th>
                <th className="text-left px-2 py-2 text-slate-500">Phone</th>
                <th className="text-left px-2 py-2 text-slate-500">Visits</th>
              </tr></thead>
              <tbody>
                {repeat.slice(0, 8).map(c => (
                  <tr key={c.phone} className="border-b border-[#2a3347]/40">
                    <td className="px-2 py-2 text-slate-200">{c.name}</td>
                    <td className="px-2 py-2 text-slate-400">{c.phone}</td>
                    <td className="px-2 py-2"><span className="badge bg-indigo-500/20 text-indigo-400">{c.visit_count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
