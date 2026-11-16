import { useRef, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { api, jsonBody, setToken } from "../api.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function AuthScreen({ onAuthenticated, theme, onToggleTheme }) {
  const [mode, setMode] = useState("login");
  const [registrationRole, setRegistrationRole] = useState("patient");
  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
    specialization: "",
    experience: "0",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const isDoctorRegistration = mode === "register" && registrationRole === "doctor";
      const path = mode === "login"
        ? "/auth/login"
        : isDoctorRegistration
          ? "/doctor/register"
          : "/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : isDoctorRegistration
          ? {
              userName: form.userName,
              email: form.email,
              password: form.password,
              specialization: form.specialization,
              experience: Number(form.experience),
            }
          : {
              userName: form.userName,
              email: form.email,
              password: form.password,
            };
      const result = await api(path, {
        method: "POST",
        body: jsonBody(body),
      });
      setToken(result.token);
      onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-photo" />
        <div className="auth-visual-shade" />
        <header className="brand brand-light">
          <span className="brand-mark"><HeartPulse size={22} strokeWidth={2.2} /></span>
          <span>clair<span className="brand-period">.</span></span>
        </header>
        <div className="hero-copy">
          <div className="eyebrow eyebrow-light"><Sparkles size={14} /> A more human kind of healthcare</div>
          <h1>Feel better.<br /><em>Feel understood.</em></h1>
          <p>Care that sees the whole you. Meet thoughtful doctors, find your rhythm, and make health feel a little more like you.</p>
          <div className="hero-trust">
            <div className="avatar-stack">
              {["photo-1559839734-2b71ea197ec2", "photo-1612349317150-e413f6a5b16d", "photo-1594824476967-48c8b964273f"].map((id) => (
                <img key={id} src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=80&q=80`} alt="" />
              ))}
            </div>
            <div><strong>Care, with a personal touch</strong><span>Appointments that fit your life</span></div>
          </div>
        </div>
        <div className="floating-note">
          <div className="floating-note-icon"><CalendarCheck2 size={18} /></div>
          <div><strong>Your next chapter</strong><span>Starts with feeling well</span></div>
          <Check size={17} className="note-check" />
        </div>
        <div className="photo-caption">Thoughtful care, wherever you are.</div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-top">
          <div className="brand brand-dark">
            <span className="brand-mark"><HeartPulse size={20} /></span>
            <span>clair<span className="brand-period">.</span></span>
          </div>
          <div className="auth-controls">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
            <span className="secure-label"><ShieldCheck size={15} /> Private & secure</span>
          </div>
        </div>
        <div className="auth-content">
          <div className="auth-heading">
            <div className="auth-kicker"><Stethoscope size={15} /> YOUR HEALTH, IN GOOD HANDS</div>
            <h2>{mode === "login" ? "Welcome back" : registrationRole === "doctor" ? "Apply to join our doctors" : "A healthier you starts here"}</h2>
            <p>{mode === "login" ? "Sign in to pick up right where you left off." : registrationRole === "doctor" ? "Submit your details for Admin review before joining the clinic." : "Create your account and make room for better care."}</p>
          </div>
          <div className="auth-tabs" role="tablist">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }} disabled={busy}>Sign in</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }} disabled={busy}>Create account</button>
          </div>
          <form onSubmit={submit} className="auth-form">
            {mode === "register" && (
              <>
                <label className="field-label">Account type
                  <select value={registrationRole} onChange={(e) => setRegistrationRole(e.target.value)} disabled={busy}>
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor application</option>
                  </select>
                </label>
                <label className="field-label">Your name
                  <input autoComplete="name" placeholder="e.g. Jamie Parker" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} required />
                </label>
              </>
            )}
            {mode === "register" && registrationRole === "doctor" && (
              <>
                <label className="field-label">Specialization
                  <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
                </label>
                <label className="field-label">Years of experience
                  <input type="number" min="0" step="1" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                </label>
              </>
            )}
            <label className="field-label">Email address
              <input autoComplete="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label className="field-label">Password
              <input autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </label>
            {error && <div className="form-alert" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" disabled={busy}>
              {busy ? <span className="spinner" /> : <>{mode === "login" ? "Sign in to Clair" : registrationRole === "doctor" ? "Submit doctor application" : "Create my account"} <ArrowRight size={17} /></>}
            </button>
          </form>
          <div className="auth-assurance"><ShieldCheck size={16} /><span>Your health information stays private and protected.</span></div>
        </div>
        <footer className="auth-footer"><span>© 2026 Clair Health</span><span>Care that feels like care.</span></footer>
      </section>
    </main>
  );
}
