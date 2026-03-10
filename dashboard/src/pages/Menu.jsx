import { useEffect, useState } from "react";
import { listMenu, createMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItem } from "../api/menu.js";
import { listHotels } from "../api/hotels.js";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

function ItemForm({ hotel_id, item, onSave, onClose }) {
  const [form, setForm] = useState({
    hotel_id,
    name: item?.name ?? "",
    price: item?.price ?? "",
    category: item?.category ?? "General",
    is_available: item?.is_available ?? true,
  });
  const [loading, setLoading] = useState(false);
  const handle = (e) => setForm(f => ({
    ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value
  }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (item) await updateMenuItem(item.id, form);
      else await createMenuItem(form);
      onSave();
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e2535] border border-[#2a3347] rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-5">{item ? "Edit Item" : "Add Menu Item"}</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Item Name *</label>
            <input name="name" className="input" required value={form.name} onChange={handle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Price (₹) *</label>
              <input name="price" type="number" step="0.01" className="input" required value={form.price} onChange={handle} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category</label>
              <select name="category" className="input" value={form.category} onChange={handle}>
                {["Starters", "Mains", "Desserts", "Drinks", "General"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" name="is_available" checked={form.is_available} onChange={handle} className="accent-indigo-500" />
            Available
          </label>
          <div className="flex gap-3 mt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2">{loading ? "Saving…" : "Save"}</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Menu() {
  const [hotel, setHotel] = useState(null);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (h) => {
    const { data } = await listMenu(h.id);
    setItems(data);
  };

  useEffect(() => {
    (async () => {
      const { data: hotels } = await listHotels();
      if (hotels.length) { setHotel(hotels[0]); await load(hotels[0]); }
      setLoading(false);
    })();
  }, []);

  const refresh = () => { setAdding(false); setEditing(null); load(hotel); };

  const handleToggle = async (id) => { await toggleMenuItem(id); load(hotel); };
  const handleDelete = async (id) => { if (confirm("Delete this item?")) { await deleteMenuItem(id); load(hotel); } };

  if (loading) return <div className="text-slate-400 text-center mt-20">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Menu</h1>
        <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2 px-4 py-2">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a3347]">
              {["Item", "Category", "Price", "Available", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-[#2a3347]/40 hover:bg-slate-800/20">
                <td className="table-cell font-medium text-white">{item.name}</td>
                <td className="table-cell text-slate-400">{item.category}</td>
                <td className="table-cell">₹{Number(item.price).toFixed(2)}</td>
                <td className="table-cell">
                  <button onClick={() => handleToggle(item.id)}>
                    {item.is_available
                      ? <ToggleRight size={22} className="text-emerald-400" />
                      : <ToggleLeft size={22} className="text-slate-600" />}
                  </button>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(item)} className="text-indigo-400 hover:text-indigo-300"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-slate-500">No menu items yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && <ItemForm hotel_id={hotel?.id} onSave={refresh} onClose={() => setAdding(false)} />}
      {editing && <ItemForm hotel_id={hotel?.id} item={editing} onSave={refresh} onClose={() => setEditing(null)} />}
    </div>
  );
}
