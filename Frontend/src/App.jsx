import { useCallback, useEffect, useRef, useState } from "react";
import { api, clearToken, getToken, jsonBody, setToken } from "./api.js";
import AppShell from "./components/AppShell.jsx";
import AppointmentModal from "./components/AppointmentModal.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import Toast from "./components/Toast.jsx";
import {
  AdminOverview,
  AppointmentList,
  AvailabilityPage,
  DoctorPendingScreen,
  DoctorOverview,
  DoctorSchedule,
  NotificationsPage,
  PatientDiscover,
  PeoplePage,
  ProfilePage,
} from "./pages/WorkspacePages.jsx";

function initialView(role) {
  if (role === "admin" || role === "doctor") return "overview";
  return "discover";
}

function preferredTheme() {
  try {
    return localStorage.getItem("clair_theme") === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("Clair could not read the saved theme preference.", error);
    return "light";
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(preferredTheme);
  const [view, setView] = useState("discover");
  const [booting, setBooting] = useState(Boolean(getToken()));
  const [toast, setToast] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [unread, setUnread] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutPending = useRef(false);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const updateUnread = useCallback((count) => setUnread(count), []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "#192231" : "#f7f8fc",
    );
    try {
      localStorage.setItem("clair_theme", theme);
    } catch (error) {
      console.error("Clair could not save the theme preference.", error);
      notify("Your theme changed, but this browser could not save the preference.", "error");
    }
  }, [theme, notify]);

  useEffect(() => {
    if (!getToken()) return undefined;
    let active = true;
    api("/api/profile")
      .then(({ profile }) => {
        if (!active) return;
        const restoredUser = { ...profile, userName: profile.name };
        setUser(restoredUser);
        setView(initialView(profile.role));
      })
      .catch((requestError) => {
        if (!active) return;
        clearToken();
        notify(`We couldn’t restore your session. Please sign in again. (${requestError.message})`, "error");
      })
      .finally(() => active && setBooting(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setUnread(0);
      setBookingDoctor(null);
      setBooting(false);
    };
    window.addEventListener("clair:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("clair:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!user) return;
    api("/notifications")
      .then((result) => setUnread((result.notifications || []).filter((item) => !item.isRead).length))
      .catch((requestError) => {
        if (getToken()) notify(`Notifications could not be refreshed: ${requestError.message}`, "error");
      });
  }, [user, notify]);

  function authenticated(nextUser) {
    setUser({ ...nextUser, userName: nextUser.userName || nextUser.name });
    setView(initialView(nextUser.role));
    setBooting(false);
  }

  async function logout() {
    if (logoutPending.current) return;
    logoutPending.current = true;
    setLoggingOut(true);
    let logoutFailed = false;
    try {
      await api("/auth/logout", { method: "POST", body: jsonBody({}) });
    } catch {
      logoutFailed = true;
    }
    clearToken();
    setUser(null);
    setBookingDoctor(null);
    setUnread(0);
    logoutPending.current = false;
    setLoggingOut(false);
    if (logoutFailed) {
      notify("Signed out on this device. The server could not confirm cookie removal.", "error");
    }
  }

  if (booting) {
    return <div className="app-boot"><span className="brand-mark"><span className="spinner" /></span><span>Opening your care space…</span></div>;
  }
  if (!user) return <><AuthScreen theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} onAuthenticated={authenticated} /><Toast toast={toast} onClose={() => setToast(null)} /></>;
  if (user.role === "doctor" && user.doctorApprovalStatus !== "approved") {
    return <DoctorPendingScreen status={user.doctorApprovalStatus} onLogout={logout} loggingOut={loggingOut} />;
  }

  let page;
  if (view === "discover" && user.role === "patient") {
    page = <PatientDiscover onBook={setBookingDoctor} notify={notify} />;
  } else if (view === "appointments") {
    page = <AppointmentList role={user.role} notify={notify} />;
  } else if (view === "overview" && user.role === "admin") {
    page = <AdminOverview setView={setView} />;
  } else if (view === "overview" && user.role === "doctor") {
    page = <DoctorOverview user={user} setView={setView} />;
  } else if (view === "schedule" && user.role === "doctor") {
    page = <DoctorSchedule />;
  } else if (view === "people" && user.role === "admin") {
    page = <PeoplePage notify={notify} />;
  } else if (view === "availability" && user.role === "doctor") {
    page = <AvailabilityPage notify={notify} />;
  } else if (view === "notifications") {
    page = <NotificationsPage notify={notify} onUnreadChange={updateUnread} />;
  } else if (view === "profile") {
    page = <ProfilePage user={user} onUserUpdated={setUser} notify={notify} />;
  } else {
    page = <div className="app-boot"><span className="spinner" /> Loading workspace…</div>;
  }

  return (
    <>
      <AppShell user={user} view={view} setView={setView} onLogout={logout} loggingOut={loggingOut} unread={unread} onUnreadChange={updateUnread} theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}>
        {page}
      </AppShell>
      {bookingDoctor && <AppointmentModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} onBooked={() => { if (view === "appointments") setView("discover"); }} notify={notify} />}
      <Toast key={toast?.id} toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
