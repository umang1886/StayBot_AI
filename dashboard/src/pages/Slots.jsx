import { useEffect, useState } from "react";
import { listSlots, createSlot, bulkCreateSlots, updateSlot, deleteSlot } from "../api/slots.js";
import { listHotels } from "../api/hotels.js";
import { Plus, Trash2, Pencil } from "lucide-react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function Slots() {
  const [hotel, setHotel] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [form, setForm] = useState({ date: "", time: "", capacity: 20 });
  const [bulk, setBulk] = useState({ days_of_week: [], time: "", capacity: 20, weeks: 4 });

  const load = async (h) => {
    const { data } = await listSlots({ hotel_id: h.id });
    setSlots(data);
  };

  useEffect(() => {
    (async () => {
      const { data: hotels } = await listHotels();
      if (hotels.length) { setHotel(hotels[0]); await load(hotels[0]); }
      setLoading(false);
    })();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await createSlot({ ...form, hotel_id: hotel.id });
    setShowAdd(false); load(hotel);
  };

  const handleBulk = async (e) => {
    e.preventDefault();
    await bulkCreateSlots({ ...bulk, hotel_id: hotel.id });
    setShowBulk(false); load(hotel);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateSlot(editSlot.id, { capacity: editSlot.capacity });
    setEditSlot(null); load(hotel);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete slot?")) { await deleteSlot(id); load(hotel); }
  };

  const toggleDay = (i) => setBulk(b => ({
    ...b,
    days_of_week: b.days_of_week.includes(i)
      ? b.days_of_week.filter(d => d !== i)
      : [...b.days_of_week, i]
  }));

  if (loading) return <div className="text-slate-400 text-center mt-20">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Slots</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)} className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
            Bulk Create
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 px-4 py-2">
            <Plus size={16} /> Add Slot
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a3347]">
              {["Date","Time","Capacity","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map(s => (
              <tr key={s.id} className="border-b border-[#2a3347]/40 hover:bg-slate-800/20">
                <td className="table-cell font-medium text-white">{s.date}</td>
                <td className="table-cell">{s.time}</td>
                <td className="table-cell">{s.capacity}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => setEditSlot(s)} className="text-indigo-400 hover:text-indigo-300"><Pencil size={15}/></button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300"><Trash2 size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {slots.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-500">No slots yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2535] border border-[#2a3347] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-5">Add Slot</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Date</label>
                <input type="date" className="input" required value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Time (e.g. 7 PM)</label>
                <input className="input" required value={form.time} placeholder="7 PM" onChange={e => setForm(f=>({...f,time:e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Capacity</label>
                <input type="number" className="input" required value={form.capacity} onChange={e => setForm(f=>({...f,capacity:e.target.value}))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 py-2">Add</button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit capacity modal */}
      {editSlot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2535] border border-[#2a3347] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-5">Edit Capacity</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Capacity for {editSlot.date} {editSlot.time}</label>
                <input type="number" className="input" value={editSlot.capacity}
                  onChange={e => setEditSlot(s=>({...s,capacity:e.target.value}))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 py-2">Save</button>
                <button type="button" onClick={() => setEditSlot(null)} className="btn-secondary flex-1 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2535] border border-[#2a3347] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-5">Bulk Slot Generator</h3>
            <form onSubmit={handleBulk} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d, i) => (
                    <button type="button" key={i} onClick={() => toggleDay(i)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                        ${bulk.days_of_week.includes(i) ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Time</label>
                  <input className="input" placeholder="7 PM" value={bulk.time}
                    onChange={e => setBulk(b=>({...b,time:e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Capacity</label>
                  <input type="number" className="input" value={bulk.capacity}
                    onChange={e => setBulk(b=>({...b,capacity:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Weeks ahead</label>
                <input type="number" className="input" min={1} max={12} value={bulk.weeks}
                  onChange={e => setBulk(b=>({...b,weeks:e.target.value}))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 py-2">Create Slots</button>
                <button type="button" onClick={() => setShowBulk(false)} className="btn-secondary flex-1 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
