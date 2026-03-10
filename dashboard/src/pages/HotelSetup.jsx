import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as hotelsApi from "../api/hotels.js";
import { CheckCircle2, ChevronRight } from "lucide-react";

const STEPS = ["Hotel Info", "Bot Token", "Google Sheet"];

export default function HotelSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hotel_name: "", city: "", address: "", contact_phone: "",
    bot_username: "", bot_token: "",
    sheet_id: "",
  });

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const next = () => { setError(""); setStep((s) => s + 1); };

  const submit = async () => {
    setLoading(true); setError("");
    try {
      await hotelsApi.createHotel(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Register Your Hotel</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Complete 3 steps to go live</p>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${i < step ? "bg-emerald-600 text-white" : i === step ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-sm ${i === step ? "text-white font-medium" : "text-slate-500"}`}>{label}</span>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-slate-600" />}
            </div>
          ))}
        </div>

        <div className="bg-[#161b27] border border-[#2a3347] rounded-2xl p-8">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Hotel Information</h2>
              {[
                { label: "Hotel / Restaurant Name", name: "hotel_name", placeholder: "Royal Hotel" },
                { label: "City",                    name: "city",        placeholder: "Ahmedabad" },
                { label: "Address",                 name: "address",     placeholder: "123 Main Street" },
                { label: "Contact Phone",           name: "contact_phone", placeholder: "+91 98765 43210" },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
                  <input name={name} className="input" placeholder={placeholder} value={form[name]} onChange={handle} />
                </div>
              ))}
              <button onClick={next} disabled={!form.hotel_name || !form.city}
                className="w-full btn-primary py-2.5 mt-2 disabled:opacity-50">
                Continue →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Telegram Bot</h2>
              <p className="text-sm text-slate-400 mb-4">
                Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noreferrer"
                  className="text-indigo-400 hover:underline">@BotFather</a> and paste the token here.
              </p>
              {[
                { label: "Bot Username (without @)", name: "bot_username", placeholder: "RoyalHotelBot" },
                { label: "Bot Token",                name: "bot_token",    placeholder: "123456:ABCdefGHI…" },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
                  <input name={name} className="input" placeholder={placeholder} value={form[name]} onChange={handle} />
                </div>
              ))}
              <button onClick={next} disabled={!form.bot_username || !form.bot_token}
                className="w-full btn-primary py-2.5 disabled:opacity-50">Continue →</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">Google Sheet</h2>
              <p className="text-sm text-slate-400 mb-4">
                Create a Google Sheet with tabs: <strong className="text-slate-300">Menu</strong>,{" "}
                <strong className="text-slate-300">Slots</strong>,{" "}
                <strong className="text-slate-300">Bookings</strong>. Paste the Sheet ID below.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Google Sheet ID</label>
                <input name="sheet_id" className="input" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  value={form.sheet_id} onChange={handle} />
                <p className="text-xs text-slate-500 mt-1">Found in the Sheet URL between /d/ and /edit</p>
              </div>
              <button onClick={submit} disabled={loading}
                className="w-full btn-primary py-2.5 disabled:opacity-50">
                {loading ? "Setting up…" : "🚀 Launch Hotel Bot"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
