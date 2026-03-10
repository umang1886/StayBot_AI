import { useEffect, useState, useMemo } from "react";
import { listBookings, cancelBooking, completeBooking, updateBooking } from "../api/bookings.js";
import { listHotels } from "../api/hotels.js";
import { Search, X, CheckCircle } from "lucide-react";

function Modal({ booking, onClose, onSave }) {
  const [form, setForm] = useState({ date: booking.date, time: booking.time, guests: booking.guests });
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const save = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e2535] border border-[#2a3347] rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-4">Booking Details</h3>
        <div className="space-y-3">
          <p className="text-sm text-slate-400"><span className="text-slate-200 font-medium">Name:</span> {booking.name}</p>
          <p className="text-sm text-slate-400"><span className="text-slate-200 font-medium">Phone:</span> {booking.phone}</p>
          {[
            { label: "Date", name: "date", type: "date" },
            { label: "Time", name: "time", type: "text" },
            { label: "Guests", name: "guests", type: "number" },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className="block text-sm text-slate-400 mb-1">{label}</label>
              <input type={type} name={name} className="input" value={form[name]} onChange={handle} />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2">{saving ? "Saving…" : "Save"}</button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2">Cancel</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS = { confirmed: "badge-confirmed", cancelled: "badge-cancelled", completed: "badge-completed" };

export default function Bookings() {
  const [hotel, setHotel] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (h) => {
    const { data } = await listBookings({ hotel_id: h.id });
    setBookings(data);
  };

  useEffect(() => {
    (async () => {
      const { data: hotels } = await listHotels();
      if (hotels.length) { setHotel(hotels[0]); await loadData(hotels[0]); }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let data = [...bookings];
    if (search) data = data.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.phone.includes(search));
    if (status) data = data.filter(b => b.status === status);
    if (date) data = data.filter(b => b.date === date);
    return data;
  }, [search, status, date, bookings]);

  const handleAction = async (action, id) => {
    if (action === "cancel") await cancelBooking(id);
    else await completeBooking(id);
    await loadData(hotel);
  };

  const handleSave = async (form) => {
    await updateBooking(selected.id, form);
    setSelected(null);
    await loadData(hotel);
  };

  if (loading) return <div className="text-slate-400 text-center mt-20">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Bookings</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9 w-56" placeholder="Search name or phone…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <input type="date" className="input w-44" value={date} onChange={e => setDate(e.target.value)} />
        <select className="input w-44" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a3347]">
              {["Name", "Phone", "Date", "Time", "Guests", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id} className="border-b border-[#2a3347]/40 hover:bg-slate-800/20 cursor-pointer"
                onClick={() => setSelected(b)}>
                <td className="table-cell font-medium text-white">{b.name}</td>
                <td className="table-cell">{b.phone}</td>
                <td className="table-cell">{b.date}</td>
                <td className="table-cell">{b.time}</td>
                <td className="table-cell">{b.guests}</td>
                <td className="table-cell"><span className={STATUS_COLORS[b.status]}>{b.status}</span></td>
                <td className="table-cell">
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {b.status === "confirmed" && <>
                      <button onClick={() => handleAction("complete", b.id)}
                        className="text-emerald-400 hover:text-emerald-300" title="Complete">
                        <CheckCircle size={15} />
                      </button>
                      <button onClick={() => handleAction("cancel", b.id)}
                        className="text-red-400 hover:text-red-300" title="Cancel">
                        <X size={15} />
                      </button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate-500">No bookings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <Modal booking={selected} onClose={() => setSelected(null)} onSave={handleSave} />}
    </div>
  );
}
