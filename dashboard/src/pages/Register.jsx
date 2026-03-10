import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import * as authApi from "../api/auth.js";
import { Bot } from "lucide-react";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      login(data.access_token, { id: data.owner_id, ...form });
      navigate("/hotel-setup");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 items-center justify-center mb-4">
            <Bot size={28} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1 text-sm">Register as a hotel owner</p>
        </div>

        <div className="bg-[#161b27] border border-[#2a3347] rounded-2xl p-8">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            {[
              { label: "Full Name",    name: "full_name", type: "text",     placeholder: "Your name" },
              { label: "Email",        name: "email",     type: "email",    placeholder: "you@hotel.com" },
              { label: "Password",     name: "password",  type: "password", placeholder: "Min 8 characters" },
              { label: "Phone",        name: "phone",     type: "tel",      placeholder: "+91 9999999999" },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
                <input name={name} type={type} required className="input"
                  placeholder={placeholder} value={form[name]} onChange={handle} />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-2.5 mt-2 disabled:opacity-60">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-5">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
