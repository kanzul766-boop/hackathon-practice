import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, jsonBody } from "../api.js";
import { demoPortraits, specialities } from "../data.js";
import AppointmentModal from "../components/AppointmentModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import PageHeader from "../components/PageHeader.jsx";

function Loading({ label = "Loading your care space…" }) {
  return <div className="loading-state"><span className="spinner" /><span>{label}</span></div>;
}

function DoctorCardSkeletons() {
  return <div className="doctor-grid" aria-label="Loading doctors" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div className="doctor-card doctor-skeleton" key={index}><div className="skeleton skeleton-photo" /><div className="doctor-card-info"><div className="skeleton skeleton-line skeleton-short" /><div className="skeleton skeleton-line skeleton-title" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line skeleton-medium" /></div></div>)}</div>;
}

function AppointmentSkeletons() {
  return <div className="appointment-list" aria-label="Loading appointments" aria-busy="true">{Array.from({ length: 5 }, (_, index) => <div className="appointment-card appointment-skeleton" key={index}><div className="skeleton skeleton-date" /><div className="skeleton-appointment-copy"><div className="skeleton skeleton-line skeleton-title" /><div className="skeleton skeleton-line skeleton-medium" /></div><div className="skeleton skeleton-pill" /></div>)}</div>;
}

function PeopleSkeleton() {
  return <section className="panel people-panel" aria-label="Loading people" aria-busy="true"><div className="people-list">{Array.from({ length: 6 }, (_, index) => <div className="people-row" key={index}><div className="skeleton skeleton-avatar" /><div className="skeleton-people-copy"><div className="skeleton skeleton-line skeleton-medium" /><div className="skeleton skeleton-line skeleton-short" /></div><div className="skeleton skeleton-pill" /></div>)}</div></section>;
}

function DashboardSkeleton() {
  return <div className="dashboard-skeleton" aria-label="Loading dashboard" aria-busy="true"><div className="skeleton skeleton-heading" /><div className="skeleton-stat-grid">{Array.from({ length: 3 }, (_, index) => <div className="panel skeleton-stat-card" key={index}><div className="skeleton skeleton-avatar" /><div className="skeleton skeleton-line skeleton-title" /><div className="skeleton skeleton-line skeleton-medium" /></div>)}</div><div className="skeleton-dashboard-panels"><div className="panel skeleton-chart"><div className="skeleton skeleton-line skeleton-title" /><div className="skeleton skeleton-chart-area" /></div><div className="panel skeleton-chart"><div className="skeleton skeleton-line skeleton-title" /><div className="skeleton skeleton-chart-area" /></div></div></div>;
}

function ErrorState({ message, retry }) {
  return <div className="error-state"><CircleHelp size={24} /><strong>We couldn’t load this just now</strong><span>{message}</span>{retry && <button className="button button-soft" onClick={retry}>Try again</button>}</div>;
}

function EmptyState({ icon: Icon = CalendarCheck2, title, copy, action, className = "" }) {
  return <div className={`empty-state ${className}`}><div className="empty-icon"><Icon size={22} /></div><strong>{title}</strong><span>{copy}</span>{action}</div>;
}

function StatusPill({ status }) {
  return <span className={`status-pill status-${status}`}>{status}</span>;
}

function displayDate(value) {
  if (!value) return "Date not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not set" : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function initials(name = "Care") {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function timeGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function currentWeekday() {
  return new Date().toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
}

export function PatientDiscover({ onBook, notify }) {
  const [doctors, setDoctors] = useState([]);
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);

  const loadDoctors = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "9" });
      if (name.trim()) params.set("name", name.trim());
      if (specialization) params.set("specialization", specialization);
      const result = await api(`/doctors?${params}`);
      setDoctors(result.doctors || []);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }, [name, specialization, page]);

  useEffect(() => {
    const timer = window.setTimeout(loadDoctors, 240);
    return () => window.clearTimeout(timer);
  }, [loadDoctors]);

  return (
    <>
      <section className="patient-welcome page-enter">
        <div className="welcome-image" />
        <div className="welcome-overlay" />
        <div className="welcome-content">
          <div className="eyebrow eyebrow-light"><Sparkles size={14} /> A little more you, in your healthcare</div>
          <h1>Care that feels<br /><em>like it gets you.</em></h1>
          <p>Find a doctor who listens, understands, and makes room for your whole story.</p>
          <a className="welcome-jump" href="#doctor-discovery">Find your doctor <ArrowRight size={16} /></a>
        </div>
        <div className="welcome-mini-card">
          <div className="mini-card-icon"><Heart size={16} fill="currentColor" /></div>
          <div><strong>Your wellbeing, first</strong><span>Care that moves at your pace</span></div>
        </div>
      </section>

      <div className="section-title-row page-enter" id="doctor-discovery">
        <div><div className="eyebrow">YOUR CARE, YOUR CHOICE</div><h2>Find the right fit</h2><p>Meet thoughtful doctors ready to listen.</p></div>
        <span className="result-count">{pagination?.total ?? "—"} {(pagination?.total ?? 0) === 1 ? "doctor" : "doctors"}</span>
      </div>
      <div className="doctor-filters page-enter">
        <label className="search-field"><Search size={18} /><input aria-label="Search by doctor name" placeholder="Search by doctor name" value={name} onChange={(event) => { setName(event.target.value); setPage(1); }} /></label>
        <label className="select-field"><SlidersHorizontal size={17} /><select value={specialization} onChange={(event) => { setSpecialization(event.target.value); setPage(1); }}><option value="">All specialities</option>{specialities.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
      </div>
      {busy ? <DoctorCardSkeletons /> : error ? <ErrorState message={error} retry={loadDoctors} /> : doctors.length ? (
        <div className="doctor-grid">
          {doctors.map((doctor, index) => {
            const image = doctor.profileImage || demoPortraits[index % demoPortraits.length];
            const isFavorite = favorites.includes(doctor.id);
            return (
              <article className="doctor-card page-enter" key={doctor.id}>
                <div className={`doctor-card-photo doctor-tone-${index % 4}`}><img src={image} alt={doctor.name} /><span className="available-tag"><i /> Active doctor</span><button className={`favorite-button ${isFavorite ? "favorited" : ""}`} onClick={() => { setFavorites((current) => isFavorite ? current.filter((id) => id !== doctor.id) : [...current, doctor.id]); notify(isFavorite ? "Removed from your saved doctors." : "Saved for this session."); }} aria-label={isFavorite ? "Remove saved doctor" : "Save doctor"} aria-pressed={isFavorite}><Heart size={17} /></button></div>
                <div className="doctor-card-info">
                  <div className="doctor-speciality">{doctor.specialization || "Primary care"}</div>
                  <h3>Dr. {doctor.name}</h3>
                  <div className="doctor-meta"><span><BadgeCheck size={15} /> {doctor.experience || 0}+ years experience</span><span><MapPin size={14} /> Clair Health Network</span></div>
                  <div className="doctor-card-bottom"><div className="doctor-rating care-note"><CalendarCheck2 size={14} /><span>Care at your pace</span></div><button className="button button-primary button-small" onClick={() => onBook({ ...doctor, image })}>Book visit <ArrowRight size={14} /></button></div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState icon={Stethoscope} title="No doctors found" copy="Try a different name or speciality." action={<button className="button button-soft" onClick={() => { setName(""); setSpecialization(""); }}>Clear filters</button>} />}
      {pagination?.totalPages > 1 && <div className="pagination"><button className="button button-soft" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pagination.totalPages}</span><button className="button button-soft" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </>
  );
}

export function AppointmentList({ role, notify }) {
  const [appointments, setAppointments] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const endpoint = role === "patient" ? "/appointments/my" : role === "doctor" ? "/appointments/doctor" : "/admin/appointments";

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "8" });
      if (status) params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const result = await api(`${endpoint}?${params}`);
      setAppointments(result.appointments || []);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }, [endpoint, status, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  function changeStatus(appointment, nextStatus) {
    setPendingAction({ kind: "status", appointment, nextStatus });
  }

  function cancel(appointment) {
    setPendingAction({ kind: "cancel", appointment });
  }

  async function confirmAction() {
    if (!pendingAction || actionBusy) return;
    setActionBusy(true);
    try {
      const { appointment, kind, nextStatus } = pendingAction;
      const result = kind === "status"
        ? await api(`/appointments/${appointment._id}/status`, { method: "PATCH", body: jsonBody({ status: nextStatus }) })
        : await api(`/appointments/${appointment._id}/cancel`, { method: "PATCH" });
      notify(result.notificationWarning || (kind === "status" ? `Appointment ${nextStatus}.` : "Appointment cancelled."), result.notificationWarning ? "error" : "success");
      setPendingAction(null);
      load();
    } catch (requestError) {
      notify(requestError.message, "error");
    } finally {
      setActionBusy(false);
    }
  }

  const title = role === "patient" ? "My appointments" : role === "doctor" ? "Received Appointments" : "Appointment management";
  const desc = role === "patient" ? "All the moments you’ve made time for your health." : role === "doctor" ? "A clear view of the people and requests in your care." : "A considered overview of care across your clinic.";
  return (
    <>
      <PageHeader eyebrow="CARE, IN MOTION" title={title} description={desc} />
      <section className="filter-toolbar page-enter">
        <label className="compact-select"><span>Status</span><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{["pending", "approved", "rejected", "cancelled"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="compact-date"><span>From</span><input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} /></label>
        <label className="compact-date"><span>To</span><input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} /></label>
        {(status || dateFrom || dateTo) && <button className="text-button" onClick={() => { setStatus(""); setDateFrom(""); setDateTo(""); }}>Clear filters <X size={14} /></button>}
        <span className="filter-result">{pagination?.total ?? 0} appointments</span>
      </section>
      {busy ? <AppointmentSkeletons /> : error ? <ErrorState message={error} retry={load} /> : appointments.length ? (
        <div className="appointment-list">
          {appointments.map((appointment) => {
            const person = role === "doctor" ? appointment.patient : appointment.doctor;
            const displayName = person?.userName;
            const specialty = person?.specialization;
            return (
              <article className="appointment-card page-enter" key={appointment._id}>
                <div className="appointment-date-block"><span>{new Date(appointment.appointmentDate).toLocaleDateString(undefined, { month: "short" })}</span><strong>{new Date(appointment.appointmentDate).getDate()}</strong><small>{new Date(appointment.appointmentDate).toLocaleDateString(undefined, { weekday: "short" })}</small></div>
                <div className="appointment-main">
                  {role === "admin" ? <div className="appointment-admin-people">
                    <span className="person-avatar">{initials(appointment.patient?.userName || "Patient")}</span>
                    <div><small>PATIENT</small><strong>{appointment.patient?.userName || "Patient"}</strong></div>
                    <span className="admin-people-separator">with</span>
                    <span className="person-avatar admin-person">{initials(appointment.doctor?.userName || "Doctor")}</span>
                    <div><small>DOCTOR</small><strong>Dr. {appointment.doctor?.userName || "Doctor"}</strong></div>
                  </div> : <div className="appointment-person">
                    <span className="person-avatar">{initials(displayName || (role === "patient" ? "Doctor" : "Patient"))}</span>
                    <div><strong>{role === "patient" ? `Dr. ${displayName || "Doctor"}` : displayName || "Patient"}</strong><span>{specialty || (role === "doctor" ? person?.email : "Your care team")}</span></div>
                  </div>}
                  <div className="appointment-reason"><small>VISIT REASON</small><span>{appointment.reason}</span></div>
                </div>
                <div className="appointment-side"><StatusPill status={appointment.status} /><span className="appointment-time"><Clock3 size={14} /> {appointment.appointmentTime}</span>
                  {role === "doctor" && appointment.status === "pending" && <div className="inline-actions"><button className="icon-action approve" onClick={() => changeStatus(appointment, "approved")} disabled={Boolean(pendingAction)} aria-label="Approve appointment" title="Approve appointment"><Check size={16} /></button><button className="icon-action reject" onClick={() => changeStatus(appointment, "rejected")} disabled={Boolean(pendingAction)} aria-label="Reject appointment" title="Reject appointment"><X size={16} /></button></div>}
                  {role === "patient" && appointment.status === "pending" && <button className="text-button cancel-link" onClick={() => cancel(appointment)} disabled={Boolean(pendingAction)}>Cancel request</button>}
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState icon={CalendarDays} title="A little breathing room" copy={status || dateFrom || dateTo ? "No appointments match these filters." : "No appointments here yet. Your next step is in good hands."} />}
      {pagination?.totalPages > 1 && <div className="pagination"><button className="button button-soft" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pagination.totalPages}</span><button className="button button-soft" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
      {pendingAction && <ConfirmDialog
        title={pendingAction.kind === "cancel" ? "Cancel appointment?" : `${pendingAction.nextStatus === "approved" ? "Approve" : "Reject"} this request?`}
        message={pendingAction.kind === "cancel" ? "This pending appointment request will be cancelled." : `This appointment will be marked ${pendingAction.nextStatus}. You can’t change its status later.`}
        confirmLabel={pendingAction.kind === "cancel" ? "Cancel request" : pendingAction.nextStatus === "approved" ? "Approve request" : "Reject request"}
        destructive={pendingAction.kind === "cancel" || pendingAction.nextStatus === "rejected"}
        busy={actionBusy}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />}
    </>
  );
}

export function AdminOverview({ setView }) {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [statsResult, appointmentResult] = await Promise.all([api("/admin/stats"), api("/admin/appointments?limit=100")]);
      setStats(statsResult);
      setAppointments(appointmentResult.appointments || []);
      setError("");
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const chartData = useMemo(
    () => ["pending", "approved", "rejected", "cancelled"].map((status) => ({
      name: status[0].toUpperCase() + status.slice(1),
      value: appointments.filter((item) => item.status === status).length,
    })),
    [appointments],
  );
  const total = (stats?.appointments || 0);
  if (busy) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} retry={load} />;

  return (
    <>
      <PageHeader eyebrow={`${currentWeekday()} · YOUR CLINIC AT A GLANCE`} title={`${timeGreeting()}, Admin`} description="Here’s the care story unfolding across your clinic today." action={<button className="button button-soft" onClick={() => setView("people")}><UsersRound size={16} /> Manage people</button>} />
      <div className="stat-grid page-enter">
        <StatCard label="Total patients" value={stats?.patients ?? 0} hint="Registered in your clinic" icon={Heart} color="lilac" trend="All patients" />
        <StatCard label="Doctors" value={stats?.doctors ?? 0} hint="Registered across specialities" icon={Stethoscope} color="blue" trend="All doctors" />
        <StatCard label="Appointments" value={total} hint="All-time appointments" icon={CalendarDays} color="peach" trend="All time" />
      </div>
      <div className="admin-analytics-grid">
        <section className="panel analytics-panel page-enter">
          <div className="panel-heading"><div><div className="eyebrow">THE BIGGER PICTURE</div><h2>Appointment pulse</h2></div><span className="subtle-select">Latest 100 appointments</span></div>
          <div className="chart-wrap">
            {appointments.length === 0 ? <EmptyState className="chart-empty-state" icon={CalendarDays} title="No appointment activity yet" copy="Status counts will appear when appointments are booked." /> : <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9599a9", fontSize: 11 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#9599a9", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)", color: "var(--ink)", boxShadow: "0 12px 30px #27234a15" }} />
                <Bar dataKey="value" fill="var(--brand-stormy)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>}
          </div>
          <div className="chart-footer"><span><i className="chart-dot" />Status mix in latest 100 appointments</span><button className="text-button" onClick={() => setView("appointments")}>View all <ArrowRight size={14} /></button></div>
        </section>
        <section className="panel snapshot-panel page-enter">
          <div className="panel-heading"><div><div className="eyebrow">APPOINTMENT OVERVIEW</div><h2>At a glance</h2></div><span className="pulse-badge"><i /> Latest 100</span></div>
          <div className="snapshot-number">{total}<span> total appointments</span></div>
          <div className="snapshot-stats">
            {["pending", "approved", "rejected", "cancelled"].map((status) => <div key={status}><span className={`status-dot status-dot-${status}`} /><span>{status}</span><strong>{appointments.filter((item) => item.status === status).length}</strong></div>)}
          </div>
          <button className="snapshot-link" onClick={() => setView("appointments")}>Explore appointment details <ArrowRight size={15} /></button>
        </section>
      </div>
      <section className="panel recent-panel page-enter">
        <div className="panel-heading"><div><div className="eyebrow">JUST IN</div><h2>Recent appointments</h2></div><button className="text-button" onClick={() => setView("appointments")}>See all <ArrowRight size={14} /></button></div>
        {appointments.length ? <div className="recent-list">{appointments.slice(0, 4).map((appointment) => <div className="recent-row" key={appointment._id}><span className="person-avatar">{initials(appointment.patient?.userName)}</span><div className="recent-who"><strong>{appointment.patient?.userName || "Patient"}</strong><span>with Dr. {appointment.doctor?.userName || "Doctor"}</span></div><span className="recent-date">{displayDate(appointment.appointmentDate)} · {appointment.appointmentTime}</span><StatusPill status={appointment.status} /></div>)}</div> : <EmptyState icon={CalendarDays} title="No appointments yet" copy="Appointment activity will appear here when requests are booked." />}
      </section>
    </>
  );
}

function StatCard({ label, value, hint, icon: Icon, color, trend }) {
  return <article className={`stat-card stat-${color}`}><div className="stat-top"><span className="stat-icon"><Icon size={18} /></span><span className="stat-trend">{trend}</span></div><strong className="stat-value">{value}</strong><span className="stat-label">{label}</span><small>{hint}</small></article>;
}

export function DoctorOverview({ user, setView }) {
  const [appointments, setAppointments] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    try { const result = await api("/appointments/doctor"); setAppointments(result.appointments || []); setError(""); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (busy) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} retry={load} />;
  const pending = appointments.filter((item) => item.status === "pending").length;
  return (
    <>
      <PageHeader eyebrow="YOUR PRACTICE, IN FLOW" title={`${timeGreeting()}, Dr. ${user.userName || "there"}`} description="A little space to focus on what matters: your patients." action={<button className="button button-primary" onClick={() => setView("availability")}><Clock3 size={16} /> Set your hours</button>} />
      <div className="doctor-welcome-grid page-enter">
        <div className="doctor-hero-card"><div className="doctor-hero-copy"><span className="eyebrow eyebrow-light">YOUR CLINIC, YOUR RHYTHM</span><h2>Care looks good<br />on you.</h2><p>Keep your practice moving at a pace that feels right.</p><button className="button button-white" onClick={() => setView("appointments")}>View requests <ArrowRight size={15} /></button></div><div className="doctor-art"><div className="art-ring ring-one" /><div className="art-ring ring-two" /><div className="art-avatar"><Stethoscope size={46} /></div><span className="art-spark art-spark-one">✦</span><span className="art-spark art-spark-two">✧</span></div></div>
        <div className="doctor-stat-tile"><div className="stat-icon stat-icon-lavender"><CalendarCheck2 size={19} /></div><span>Pending requests</span><strong>{pending}</strong><small>Waiting for your review</small><button className="text-button" onClick={() => setView("appointments")}>Review now <ArrowRight size={14} /></button></div>
        <div className="doctor-stat-tile doctor-stat-soft"><div className="stat-icon stat-icon-blue"><UsersRound size={19} /></div><span>All appointments</span><strong>{appointments.length}</strong><small>Requests assigned to you</small><span className="doctor-stat-foot"><Activity size={14} /> Thoughtful care, daily</span></div>
      </div>
      <section className="panel recent-panel page-enter">
        <div className="panel-heading"><div><div className="eyebrow">YOUR NEXT CONNECTIONS</div><h2>Recent appointments</h2></div><button className="text-button" onClick={() => setView("appointments")}>Manage all <ArrowRight size={14} /></button></div>
        {appointments.length ? <div className="recent-list">{appointments.slice(0, 4).map((appointment) => <div className="recent-row" key={appointment._id}><span className="person-avatar">{initials(appointment.patient?.userName)}</span><div className="recent-who"><strong>{appointment.patient?.userName || "Patient"}</strong><span>{appointment.reason}</span></div><span className="recent-date">{displayDate(appointment.appointmentDate)} · {appointment.appointmentTime}</span><StatusPill status={appointment.status} /></div>)}</div> : <EmptyState title="Your schedule is open" copy="New requests from patients will show up here." />}
      </section>
    </>
  );
}

export function DoctorPendingScreen({ status, onLogout, loggingOut }) {
  const rejected = status === "rejected";
  return (
    <main className="app-boot">
      <section className="panel doctor-pending-card">
        <span className="brand-mark"><Stethoscope size={22} /></span>
        <div className="eyebrow">{rejected ? "APPLICATION UPDATE" : "APPLICATION RECEIVED"}</div>
        <h1>{rejected ? "Your application was not approved" : "Your application is under review"}</h1>
        <p>{rejected
          ? "Please contact the clinic if you believe this decision needs review."
          : "You can sign in again later. Your Doctor workspace will be available after an Admin approves your account."}</p>
        <button className="button button-primary" onClick={onLogout} disabled={loggingOut}>
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </section>
    </main>
  );
}

export function DoctorSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const localToday = new Date();
      localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
      const dateFrom = localToday.toISOString().slice(0, 10);
      const params = new URLSearchParams({
        status: "approved",
        dateFrom,
        page: "1",
        limit: "100",
      });
      const result = await api(`/appointments/doctor?${params}`);
      setAppointments(result.appointments || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader eyebrow="YOUR UPCOMING CARE" title="My Schedule" description="Your upcoming approved appointments, all in one place." />
      {busy ? <AppointmentSkeletons /> : error ? <ErrorState message={error} retry={load} /> : appointments.length ? (
        <div className="appointment-list">
          {appointments.map((appointment) => (
            <article className="appointment-card page-enter" key={appointment._id}>
              <div className="appointment-date-block">
                <span>{new Date(appointment.appointmentDate).toLocaleDateString(undefined, { month: "short" })}</span>
                <strong>{new Date(appointment.appointmentDate).getDate()}</strong>
                <small>{new Date(appointment.appointmentDate).toLocaleDateString(undefined, { weekday: "short" })}</small>
              </div>
              <div className="appointment-main">
                <div className="appointment-person">
                  <span className="person-avatar">{initials(appointment.patient?.userName || "Patient")}</span>
                  <div><strong>{appointment.patient?.userName || "Patient"}</strong><span>{appointment.patient?.email}</span></div>
                </div>
                <div className="appointment-reason"><small>VISIT REASON</small><span>{appointment.reason}</span></div>
              </div>
              <div className="appointment-side">
                <StatusPill status={appointment.status} />
                <span className="appointment-time"><Clock3 size={14} /> {appointment.appointmentTime}</span>
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState icon={CalendarDays} title="Your schedule is open" copy="Approved appointments will appear here." />}
    </>
  );
}

export function PeoplePage({ notify }) {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userName: "", email: "", password: "", specialization: "", experience: "0" });
  const [filter, setFilter] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const creatingDoctor = useRef(false);
  const load = useCallback(async () => {
    setBusy(true);
    try { const result = await api("/admin/users"); setUsers(result.users || []); setError(""); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const visibleUsers = users.filter((user) => `${user.userName} ${user.email} ${user.role} ${user.specialization || ""}`.toLowerCase().includes(filter.toLowerCase()));

  async function createDoctor(event) {
    event.preventDefault();
    if (creatingDoctor.current) return;
    creatingDoctor.current = true;
    setSaving(true);
    try {
      await api("/admin/doctors", { method: "POST", body: jsonBody({ ...form, experience: Number(form.experience) }) });
      setForm({ userName: "", email: "", password: "", specialization: "", experience: "0" });
      setFormOpen(false);
      notify("Doctor account created.");
      load();
    } catch (requestError) { notify(requestError.message, "error"); }
    finally { creatingDoctor.current = false; setSaving(false); }
  }

  function changeActive(user) {
    setPendingAction({ kind: "status", user });
  }

  function removeUser(user) {
    setPendingAction({ kind: "delete", user });
  }

  function reviewDoctor(user, status) {
    setPendingAction({ kind: "approval", user, status });
  }

  async function confirmAction() {
    if (!pendingAction || actionBusy) return;
    setActionBusy(true);
    try {
      const { kind, user } = pendingAction;
      if (kind === "status") {
        await api(`/admin/users/${user.id}/status`, { method: "PATCH", body: jsonBody({ isActive: !user.isActive }) });
      } else if (kind === "approval") {
        await api(`/admin/doctors/${user.id}/approval`, {
          method: "PATCH",
          body: jsonBody({ status: pendingAction.status }),
        });
      } else {
        await api(`/admin/users/${user.id}`, { method: "DELETE" });
      }
      notify(
        kind === "status"
          ? `${user.userName} ${user.isActive ? "deactivated" : "activated"}.`
          : kind === "approval"
            ? `Doctor application ${pendingAction.status}.`
            : "User removed.",
      );
      setPendingAction(null);
      load();
    } catch (requestError) {
      notify(requestError.message, "error");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="THE PEOPLE BEHIND THE CARE" title="People & doctors" description="A thoughtful view of everyone making your clinic feel like a community." action={<button className="button button-primary" onClick={() => setFormOpen((value) => !value)}><UserPlus size={16} /> Add a doctor</button>} />
      {formOpen && <form className="panel doctor-create-form page-enter" onSubmit={createDoctor}><div className="panel-heading"><div><div className="eyebrow">GROW YOUR CARE TEAM</div><h2>New doctor account</h2></div><button type="button" className="icon-button" onClick={() => setFormOpen(false)} aria-label="Close"><X size={18} /></button></div><div className="form-grid"><label className="field-label">Doctor name<input required value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} /></label><label className="field-label">Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label className="field-label">Temporary password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><label className="field-label">Specialization<input required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></label><label className="field-label">Years of experience<input type="number" min="0" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></label></div><button className="button button-primary" disabled={saving}>{saving ? <span className="spinner" /> : "Create doctor account"}</button></form>}
      <div className="people-toolbar page-enter"><label className="search-field people-search"><Search size={17} /><input placeholder="Search people by name, email or role" value={filter} onChange={(e) => setFilter(e.target.value)} /></label><span className="result-count">{visibleUsers.length} people</span></div>
      {busy ? <PeopleSkeleton /> : error ? <ErrorState message={error} retry={load} /> : visibleUsers.length ? (
        <section className="panel people-panel page-enter">
          <div className="people-list">{visibleUsers.map((user, index) => <div className="people-row" key={user.id}>
            <span className={`people-avatar people-avatar-${index % 4}`}>{initials(user.userName)}</span>
            <div className="people-identity"><strong>{user.userName}</strong><span>{user.email}</span></div>
            <span className={`role-tag role-${user.role}`}>{user.role}</span>
            <span className="people-specialty">{user.specialization || (user.role === "patient" ? "Patient" : "—")}</span>
            <span className={`active-label ${user.isActive ? "is-active" : "is-inactive"}`}><i />{user.isActive ? "Active" : "Inactive"}{user.role === "doctor" ? ` · ${user.doctorApprovalStatus || "approved"}` : ""}</span>
            {user.role !== "admin" && <div className="row-actions">
              {user.role === "doctor" && user.doctorApprovalStatus === "pending" && <>
                <button className="text-button" onClick={() => reviewDoctor(user, "approved")} disabled={Boolean(pendingAction)}>Approve</button>
                <button className="text-button danger-text" onClick={() => reviewDoctor(user, "rejected")} disabled={Boolean(pendingAction)}>Reject</button>
              </>}
              <button className="text-button" onClick={() => changeActive(user)} disabled={Boolean(pendingAction)}>{user.isActive ? "Deactivate" : "Activate"}</button>
              <button className="text-button danger-text" onClick={() => removeUser(user)} disabled={Boolean(pendingAction)}>Remove</button>
            </div>}
          </div>)}</div>
        </section>
      ) : <EmptyState icon={UsersRound} title="No matching people" copy="Try a different search." />}
      {pendingAction && <ConfirmDialog
        title={pendingAction.kind === "delete"
          ? "Remove this account?"
          : pendingAction.kind === "approval"
            ? `${pendingAction.status === "approved" ? "Approve" : "Reject"} this Doctor application?`
            : `${pendingAction.user.isActive ? "Deactivate" : "Activate"} this account?`}
        message={pendingAction.kind === "delete"
          ? `${pendingAction.user.userName} will be permanently removed from Clair.`
          : pendingAction.kind === "approval"
            ? `${pendingAction.user.userName}'s Doctor application will be marked ${pendingAction.status}.`
            : `This account will be ${pendingAction.user.isActive ? "deactivated and unable to sign in" : "activated"} immediately.`}
        confirmLabel={pendingAction.kind === "delete"
          ? "Remove account"
          : pendingAction.kind === "approval"
            ? pendingAction.status === "approved" ? "Approve application" : "Reject application"
            : pendingAction.user.isActive ? "Deactivate account" : "Activate account"}
        destructive={pendingAction.kind === "delete" || pendingAction.kind === "approval" && pendingAction.status === "rejected" || pendingAction.kind === "status" && pendingAction.user.isActive}
        busy={actionBusy}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />}
    </>
  );
}

export function AvailabilityPage({ notify }) {
  const [form, setForm] = useState({ availableDays: [], startTime: "", endTime: "" });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api("/doctors/availability");
      if (result.availability) {
        setForm({
          availableDays: result.availability.availableDays,
          startTime: result.availability.startTime,
          endTime: result.availability.endTime,
        });
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  function toggleDay(day) {
    setForm((current) => ({ ...current, availableDays: current.availableDays.includes(day) ? current.availableDays.filter((item) => item !== day) : [...current.availableDays, day] }));
  }
  async function save(event) {
    event.preventDefault();
    if (saving.current) return;
    if (form.startTime >= form.endTime) {
      setError("End time must be later than start time.");
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      let result;
      try {
        result = await api("/doctors/availability", { method: "PATCH", body: jsonBody(form) });
      } catch (requestError) {
        if (!requestError.message.toLowerCase().includes("availability not found")) throw requestError;
        result = await api("/doctors/availability", { method: "POST", body: jsonBody(form) });
      }
      notify("Your availability is saved.");
      setForm({ availableDays: result.availability.availableDays, startTime: result.availability.startTime, endTime: result.availability.endTime });
    } catch (requestError) { setError(requestError.message); }
    finally { saving.current = false; setBusy(false); }
  }
  return (
    <>
      <PageHeader eyebrow="MAKE ROOM FOR CARE" title="My Availability" description="Choose the working days and hours you want patients to see. You can update them whenever your schedule changes." />
      <div className="availability-layout">
        <form className="panel availability-editor page-enter" onSubmit={save}>
          <div className="panel-heading"><div><div className="eyebrow">WEEKLY RHYTHM</div><h2>When are you available?</h2></div><span className="calendar-mark"><CalendarDays size={20} /></span></div>
          {loading && <Loading label="Loading your saved availability…" />}
          <div className="day-picker">{days.map((day) => <button key={day} type="button" onClick={() => toggleDay(day)} className={`day-chip ${form.availableDays.includes(day) ? "day-selected" : ""}`}><span>{day.slice(0, 3)}</span>{form.availableDays.includes(day) && <Check size={13} />}</button>)}</div>
          <div className="time-range"><label className="field-label">Start time<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></label><span className="time-dash">to</span><label className="field-label">End time<input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></label></div>
          {error && <div className="form-alert">{error}</div>}
          <button className="button button-primary" disabled={busy || loading || !form.availableDays.length}>{busy ? <span className="spinner" /> : "Save availability"}</button>
        </form>
        <aside className="availability-aside page-enter"><div className="availability-illustration"><div className="availability-orb"><Clock3 size={32} /></div><span className="orbit-dot" /><span className="orbit-dot orbit-dot-two" /></div><div className="eyebrow">A GENTLER SCHEDULE</div><h3>Good boundaries<br />make better care.</h3><p>Your availability helps patients find a time that works for both of you. You can update these hours whenever life changes.</p><div className="aside-tip"><Sparkles size={16} /><span>Choose your complete schedule; saving replaces the current hours.</span></div></aside>
      </div>
    </>
  );
}

export function NotificationsPage({ notify, onUnreadChange }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [readingId, setReadingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    try { const result = await api("/notifications"); setItems(result.notifications || []); setError(""); onUnreadChange?.((result.notifications || []).filter((item) => !item.isRead).length); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }, [onUnreadChange]);
  useEffect(() => { load(); }, [load]);
  async function markRead(item) {
    if (readingId || markingAll) return;
    setReadingId(item._id);
    try {
      await api(`/notifications/${item._id}/read`, { method: "PATCH" });
      const next = items.map((entry) => entry._id === item._id ? { ...entry, isRead: true } : entry);
      setItems(next);
      onUnreadChange?.(next.filter((entry) => !entry.isRead).length);
      notify("Marked as read.");
    } catch (requestError) { notify(requestError.message, "error"); }
    finally { setReadingId(null); }
  }
  async function markAllRead() {
    if (markingAll || readingId) return;
    const unreadItems = items.filter((item) => !item.isRead);
    if (!unreadItems.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(unreadItems.map((item) => api(`/notifications/${item._id}/read`, { method: "PATCH" })));
      const next = items.map((item) => ({ ...item, isRead: true }));
      setItems(next);
      onUnreadChange?.(0);
      notify("All notifications marked as read.");
    } catch (requestError) {
      await load();
      notify(requestError.message, "error");
    } finally {
      setMarkingAll(false);
    }
  }
  return (
    <>
      <PageHeader eyebrow="A LITTLE NOTE FROM YOUR CARE TEAM" title="Notifications" description="Important moments and updates, all in one calm place." action={items.some((item) => !item.isRead) && <button className="button button-soft" onClick={markAllRead} disabled={markingAll || Boolean(readingId)}>{markingAll ? <span className="spinner" /> : "Mark all read"}</button>} />
      {busy ? <Loading label="Gathering your updates…" /> : error ? <ErrorState message={error} retry={load} /> : items.length ? <div className="notification-list">{items.map((item) => <article key={item._id} className={`notification-card page-enter ${item.isRead ? "notification-read" : ""}`}><span className={`notification-icon notification-${item.type}`}><CalendarCheck2 size={19} /></span><div className="notification-copy"><div><strong>{item.message}</strong>{!item.isRead && <i className="unread-dot" />}</div><span>{item.relatedAppointment ? `Appointment · ${displayDate(item.relatedAppointment.appointmentDate)}${item.relatedAppointment.appointmentTime ? ` at ${item.relatedAppointment.appointmentTime}` : ""}` : "Care update"} · {new Date(item.createdAt).toLocaleString()}</span></div>{!item.isRead && <button className="text-button" onClick={() => markRead(item)} disabled={markingAll || readingId === item._id}>{readingId === item._id ? <span className="spinner" /> : "Mark read"}</button>}</article>)}</div> : <EmptyState icon={Sparkles} title="All caught up" copy="When there’s news from your care team, you’ll find it here." />}
    </>
  );
}

export function ProfilePage({ user, onUserUpdated, notify }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", specialization: "", experience: 0 });
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const savingRef = useRef(false);
  const uploadRef = useRef(false);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await api("/api/profile");
      setProfile(result.profile);
      setForm({ name: result.profile.name, specialization: result.profile.specialization || "", experience: result.profile.experience ?? 0 });
      setError("");
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(event) {
    event.preventDefault();
    if (savingRef.current) return;
    if (!form.name.trim()) {
      notify("Please enter your name.", "error");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const payload = user.role === "doctor" ? form : { name: form.name };
      const result = await api("/api/profile", { method: "PATCH", body: jsonBody(payload) });
      setProfile(result.profile);
      onUserUpdated({ ...user, name: result.profile.name, userName: result.profile.name, profileImage: result.profile.profileImage });
      notify("Your profile is up to date.");
    } catch (requestError) { notify(requestError.message, "error"); }
    finally { savingRef.current = false; setSaving(false); }
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (uploadRef.current) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      notify("Choose a JPEG, PNG, or WebP image smaller than 5 MB.", "error");
      event.target.value = "";
      return;
    }
    uploadRef.current = true;
    const formData = new FormData();
    formData.append("profileImage", file);
    setUploading(true);
    try {
      const result = await api("/api/profile/image", { method: "POST", body: formData });
      setProfile(result.profile);
      onUserUpdated({ ...user, profileImage: result.profile.profileImage });
      notify("Profile photo updated.");
    } catch (requestError) { notify(requestError.message, "error"); }
    finally { uploadRef.current = false; setUploading(false); event.target.value = ""; }
  }

  if (busy) return <Loading label="Opening your profile…" />;
  if (error) return <ErrorState message={error} retry={load} />;
  return (
    <>
      <PageHeader eyebrow="A SPACE THAT’S JUST YOURS" title="Your profile" description="Keep your details fresh. Your care team can meet you where you are." />
      <div className="profile-layout page-enter">
        <aside className="panel profile-card">
          <div className="profile-cover"><div className="cover-orb cover-orb-one" /><div className="cover-orb cover-orb-two" /></div>
          <div className="profile-portrait-wrap"><img src={profile.profileImage || demoPortraits[user.role === "doctor" ? 0 : user.role === "admin" ? 2 : 1]} alt="" className="profile-portrait" /><label className="photo-edit" aria-label="Upload profile image"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading} /><span>{uploading ? <span className="spinner" /> : <Sparkles size={15} />}</span></label></div>
          <h2>{profile.name}</h2><span className={`role-tag role-${profile.role}`}>{profile.role}</span><p>{profile.email}</p>{profile.specialization && <div className="profile-specialty"><Stethoscope size={15} />{profile.specialization} · {profile.experience} years</div>}
          <div className="profile-protected"><BadgeCheck size={16} /><span>Your information is private and protected.</span></div>
        </aside>
        <form className="panel profile-editor" onSubmit={save}><div className="panel-heading"><div><div className="eyebrow">PERSONAL DETAILS</div><h2>Make it yours</h2></div></div>
          <label className="field-label">Your name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="field-label">Email address<input value={profile.email} disabled /><small>Email can’t be changed here.</small></label>
          {user.role === "doctor" && <><label className="field-label">Specialization<input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></label><label className="field-label">Years of experience<input type="number" min="0" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} /></label></>}
          <button className="button button-primary" disabled={saving}>{saving ? <span className="spinner" /> : "Save changes"}</button>
        </form>
      </div>
    </>
  );
}
