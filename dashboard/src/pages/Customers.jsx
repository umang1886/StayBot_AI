import { useEffect, useState } from "react";
import { listCustomers, getCustomerDetail, exportCustomers } from "../api/customers.js";
import { listHotels } from "../api/hotels.js";
import { Search, Download, X } from "lucide-react";

export default function Customers() {
  const [hotel, setHotel] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: hotels } = await listHotels();
      if (hotels.length) {
        setHotel(hotels[0]);
        const { data } = await listCustomers({ hotel_id: hotels[0].id });
        setCustomers(data);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = search
    ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    : customers;

  const openDetail = async (c) => {
    const { data } = await getCustomerDetail(c.phone, hotel.id);
    setDetail(data);
  };

  const handleExport = async () => {
    const { data: blob } = await exportCustomers(hotel.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "customers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-slate-400 text-center mt-20">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="relative w-64">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input pl-9" placeholder="Search name or phone…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a3347]">
              {["Name","Phone","Bookings","Last Visit"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.phone} className="border-b border-[#2a3347]/40 hover:bg-slate-800/20 cursor-pointer"
                onClick={() => openDetail(c)}>
                <td className="table-cell font-medium text-white">{c.name}</td>
                <td className="table-cell">{c.phone}</td>
                <td className="table-cell"><span className="badge bg-indigo-500/20 text-indigo-400">{c.total_bookings}</span></td>
                <td className="table-cell">{c.last_visit}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-slate-500">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2535] border border-[#2a3347] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{detail.name}</h3>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <p className="text-slate-400 text-sm mb-4">📞 {detail.phone} · {detail.total_bookings} bookings</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#2a3347]">
                <th className="text-left px-2 py-2 text-slate-500">Date</th>
                <th className="text-left px-2 py-2 text-slate-500">Time</th>
                <th className="text-left px-2 py-2 text-slate-500">Guests</th>
                <th className="text-left px-2 py-2 text-slate-500">Status</th>
              </tr></thead>
              <tbody>
                {detail.bookings.map(b => (
                  <tr key={b.id} className="border-b border-[#2a3347]/40">
                    <td className="px-2 py-2 text-slate-300">{b.date}</td>
                    <td className="px-2 py-2 text-slate-400">{b.time}</td>
                    <td className="px-2 py-2 text-slate-400">{b.guests}</td>
                    <td className="px-2 py-2"><span className={`badge-${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
