import { useEffect, useState } from "react";
import { listHotels, updateHotel, updateHotelSheet } from "../api/hotels.js";
import { changePassword } from "../api/auth.js";
import { Save } from "lucide-react";

function Section({ title, children }) {
  return (
    <div className="card space-y-4">
      <h2 className="text-base font-semibold text-white border-b border-[#2a3347] pb-3">{title}</h2>
      {children}
    </div>
  );
}

export default function Settings() {
  const [hotel, setHotel] = useState(null);
  const [hotelForm, setHotelForm] = useState({});
  const [sheetId, setSheetId] = useState("");
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [msg, setMsg] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: hotels } = await listHotels();
      if (hotels.length) {
        setHotel(hotels[0]);
        setHotelForm({
          hotel_name: hotels[0].hotel_name,
          city: hotels[0].city,
          address: hotels[0].address ?? "",
          contact_phone: hotels[0].contact_phone ?? "",
        });
        setSheetId(hotels[0].sheet_id ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const saveHotel = async () => {
    try { await updateHotel(hotel.id, hotelForm); setMsg(m => ({ ...m, hotel: "✓ Saved" })); }
    catch (e) { setMsg(m => ({ ...m, hotel: e.message })); }
  };

  const saveSheet = async () => {
    try { await updateHotelSheet(hotel.id, sheetId); setMsg(m => ({ ...m, sheet: "✓ Saved" })); }
    catch (e) { setMsg(m => ({ ...m, sheet: e.message })); }
  };

  const savePw = async () => {
    if (pwForm.new_password !== pwForm.confirm) return setMsg(m => ({ ...m, pw: "Passwords don't match." }));
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setMsg(m => ({ ...m, pw: "✓ Password changed" }));
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (e) { setMsg(m => ({ ...m, pw: e.message })); }
  };

  if (loading) return <div className="text-slate-400 text-center mt-20">Loading…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Hotel profile */}
      <Section title="Hotel Profile">
        {[
          { label: "Hotel Name", key: "hotel_name" },
          { label: "City",       key: "city" },
          { label: "Address",    key: "address" },
          { label: "Phone",      key: "contact_phone" },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-sm text-slate-400 mb-1">{label}</label>
            <input className="input" value={hotelForm[key] ?? ""} onChange={e => setHotelForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
        {msg.hotel && <p className={`text-sm ${msg.hotel.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{msg.hotel}</p>}
        <button onClick={saveHotel} className="btn-primary flex items-center gap-2 px-4 py-2">
          <Save size={15} /> Save Changes
        </button>
      </Section>

      {/* Bot settings */}
      {hotel && (
        <Section title="Bot Settings">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Bot Username (read-only)</label>
            <input className="input opacity-60 cursor-not-allowed" readOnly value={`@${hotel.bot_username}`} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Google Sheet ID</label>
            <input className="input" value={sheetId} onChange={e => setSheetId(e.target.value)} />
          </div>
          {msg.sheet && <p className={`text-sm ${msg.sheet.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{msg.sheet}</p>}
          <button onClick={saveSheet} className="btn-primary flex items-center gap-2 px-4 py-2">
            <Save size={15} /> Update Sheet
          </button>
        </Section>
      )}

      {/* Password change */}
      <Section title="Change Password">
        {[
          { label: "Current Password", key: "current_password" },
          { label: "New Password",     key: "new_password" },
          { label: "Confirm Password", key: "confirm" },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-sm text-slate-400 mb-1">{label}</label>
            <input type="password" className="input" value={pwForm[key]}
              onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
        {msg.pw && <p className={`text-sm ${msg.pw.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{msg.pw}</p>}
        <button onClick={savePw} className="btn-primary flex items-center gap-2 px-4 py-2">
          <Save size={15} /> Change Password
        </button>
      </Section>
    </div>
  );
}
