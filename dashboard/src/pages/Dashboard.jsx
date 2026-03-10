import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSummary, getBookingsPerDay } from "../api/analytics.js";
import { listBookings } from "../api/bookings.js";
import { listHotels } from "../api/hotels.js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { CalendarCheck, UtensilsCrossed, Users, Clock3, ArrowRight } from "lucide-react";

function SummaryCard({ label, value, icon, color }) {
  const IconComp = icon;
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <IconComp size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [hotel, setHotel] = useState(null);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: hotels } = await listHotels();
        if (!hotels.length) return;
        const h = hotels[0];
        setHotel(h);
        const [sumRes, chartRes, bookRes] = await Promise.all([
          getSummary(h.id),
          getBookingsPerDay({ hotel_id: h.id }),
          listBookings({ hotel_id: h.id }),
        ]);
        setSummary(sumRes.data);
        setChartData(chartRes.data.slice(-7));
        setRecentBookings(bookRes.data.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-60 text-slate-400">Loading…</div>
  );

  if (!hotel) return (
    <div className="text-center py-20">
      <p className="text-slate-400 mb-4">No hotel found. Set up your first hotel.</p>
      <Link to="/hotel-setup" className="btn-primary px-6 py-2.5">Register Hotel</Link>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{hotel.hotel_name}</h1>
        <p className="text-slate-400 text-sm mt-1">{hotel.city} · @{hotel.bot_username}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Bookings Today"      value={summary?.today_bookings}        icon={CalendarCheck}    color="bg-indigo-600" />
        <SummaryCard label="Seats Available"     value={summary?.available_slots_today} icon={Users}            color="bg-emerald-600" />
        <SummaryCard label="Active Menu Items"   value={summary?.active_menu_items}     icon={UtensilsCrossed} color="bg-amber-600" />
        <SummaryCard label="Total Capacity"      value={summary?.total_slot_capacity_today} icon={Clock3}       color="bg-cyan-600" />
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">Bookings – Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#1e2535", border: "1px solid #2a3347", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#818cf8" }}
            />
            <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Recent Bookings</h2>
          <Link to="/dashboard/bookings" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No bookings yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a3347]">
                {["Name", "Date", "Time", "Guests", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id} className="border-b border-[#2a3347]/50 hover:bg-slate-800/30">
                  <td className="table-cell font-medium text-white">{b.name}</td>
                  <td className="table-cell">{b.date}</td>
                  <td className="table-cell">{b.time}</td>
                  <td className="table-cell">{b.guests}</td>
                  <td className="table-cell">
                    <span className={`badge-${b.status}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
