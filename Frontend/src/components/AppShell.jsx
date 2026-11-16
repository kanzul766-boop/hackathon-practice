import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bell,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Grid2X2,
  HeartPulse,
  LogOut,
  Search,
  Settings2,
  UserRound,
  UsersRound,
} from "lucide-react";
import gsap from "gsap";
import { navByRole } from "../data.js";
import { api } from "../api.js";
import ThemeToggle from "./ThemeToggle.jsx";

const icons = {
  search: Search,
  calendar: CalendarDays,
  bell: Bell,
  user: UserRound,
  grid: Grid2X2,
  clock: Clock3,
  users: UsersRound,
};

export default function AppShell({ user, view, setView, onLogout, loggingOut = false, children, unread = 0, onUnreadChange, theme, onToggleTheme }) {
  const mainRef = useRef(null);
  const notificationRef = useRef(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationReload, setNotificationReload] = useState(0);
  const items = navByRole[user.role] || navByRole.patient;
  const greetingName = user.name || user.userName || "there";
  const roleTitle = user.role === "admin" ? "Care operations" : user.role === "doctor" ? "Clinical workspace" : "Your care space";

  useEffect(() => {
    if (!notificationOpen) return undefined;
    let active = true;
    setNotificationBusy(true);
    setNotificationError("");
    api("/notifications")
      .then((result) => {
        if (!active) return;
        const notifications = result.notifications || [];
        setNotificationItems(notifications.slice(0, 5));
        onUnreadChange?.(notifications.filter((item) => !item.isRead).length);
      })
      .catch((error) => active && setNotificationError(error.message))
      .finally(() => active && setNotificationBusy(false));
    const closeOnOutsideClick = (event) => {
      if (!notificationRef.current?.contains(event.target)) setNotificationOpen(false);
    };
    const closeOnEscape = (event) => event.key === "Escape" && setNotificationOpen(false);
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      active = false;
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationOpen, notificationReload, onUnreadChange]);

  useEffect(() => {
    if (!mainRef.current) return;
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      const cleanups = [];
      const boundCards = new WeakSet();
      const animateEntries = (container) => {
        const entering = [];
        if (container.matches?.(".page-enter, .doctor-card, .stat-card, .appointment-card")) entering.push(container);
        entering.push(...container.querySelectorAll?.(".page-enter, .doctor-card, .stat-card, .appointment-card") || []);
        if (entering.length) gsap.fromTo(entering,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.42, stagger: 0.045, ease: "power2.out", clearProps: "transform" },
        );
      };
      const bindCardHover = (container) => {
        const cards = [];
        if (container.matches?.(".doctor-card, .stat-card, .appointment-card")) cards.push(container);
        cards.push(...container.querySelectorAll?.(".doctor-card, .stat-card, .appointment-card") || []);
        cards.forEach((card) => {
          if (boundCards.has(card)) return;
          boundCards.add(card);
          const enter = () => gsap.to(card, { y: -3, duration: 0.18, ease: "power2.out", overwrite: true });
          const leave = () => gsap.to(card, { y: 0, duration: 0.2, ease: "power2.out", overwrite: true });
          card.addEventListener("mouseenter", enter);
          card.addEventListener("mouseleave", leave);
          cleanups.push(() => {
            card.removeEventListener("mouseenter", enter);
            card.removeEventListener("mouseleave", leave);
            gsap.killTweensOf(card);
          });
        });
      };
      const handleAdded = (node) => {
        if (!(node instanceof Element)) return;
        animateEntries(node);
        bindCardHover(node);
      };
      const observer = new MutationObserver((records) => {
        records.forEach((record) => record.addedNodes.forEach(handleAdded));
      });
      animateEntries(mainRef.current);
      bindCardHover(mainRef.current);
      observer.observe(mainRef.current, { childList: true, subtree: true });
      return () => {
        observer.disconnect();
        cleanups.forEach((cleanup) => cleanup());
      };
    });
    return () => motion.revert();
  }, [view]);

  const avatar = useMemo(() => (greetingName[0] || "C").toUpperCase(), [greetingName]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand brand-dark sidebar-brand" onClick={() => setView(user.role === "patient" ? "discover" : "overview")}>
          <span className="brand-mark"><HeartPulse size={20} /></span><span>clair<span className="brand-period">.</span></span>
        </button>
        <div className="workspace-label">{roleTitle}</div>
        <nav className="side-nav" aria-label="Main navigation">
          {items.map((item) => {
            const Icon = icons[item.icon];
            return (
              <button key={item.id} className={`nav-item ${view === item.id ? "selected" : ""}`} onClick={() => setView(item.id)} aria-current={view === item.id ? "page" : undefined}>
                <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
                {item.id === "notifications" && unread > 0 && <span className="nav-count">{unread}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-support">
          <div className="support-orbit"><Activity size={19} /></div>
          <strong>A little help?</strong>
          <span>Your care team is here for you.</span>
          <button onClick={() => setView("profile")}>Visit your profile <span>↗</span></button>
        </div>
        <button className="nav-item logout-item" onClick={onLogout} disabled={loggingOut}><LogOut size={18} /><span>{loggingOut ? "Signing out…" : "Sign out"}</span></button>
        <div className="sidebar-legal">Thoughtful care, by Clair Health</div>
      </aside>
      <main className="workspace" ref={mainRef}>
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{items.find((item) => item.id === view)?.label || view}</strong></div>
          <div className="topbar-right">
            <div className="top-notification-wrap" ref={notificationRef}>
              <button className="top-icon" onClick={() => setNotificationOpen((open) => !open)} aria-label="Notifications" aria-expanded={notificationOpen} aria-controls="notification-popover"><Bell size={18} />{unread > 0 && <i />}</button>
              {notificationOpen && <section className="notification-popover" id="notification-popover" aria-label="Recent notifications">
                <div className="notification-popover-heading"><div><span className="eyebrow">YOUR UPDATES</span><strong>Notifications</strong></div><span className="notification-popover-count">{unread} unread</span></div>
                {notificationBusy ? <div className="notification-popover-message"><span className="spinner" /> Loading updates…</div>
                  : notificationError ? <div className="notification-popover-message notification-popover-error">{notificationError}<button className="text-button" onClick={() => setNotificationReload((value) => value + 1)}>Try again</button></div>
                    : notificationItems.length ? <div className="notification-popover-list">{notificationItems.map((item) => <button className={`notification-popover-item ${item.isRead ? "" : "notification-popover-unread"}`} key={item._id} onClick={() => { setNotificationOpen(false); setView("notifications"); }}><span className="notification-popover-icon"><CalendarCheck2 size={16} /></span><span><strong>{item.message}</strong><small>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Care update"}</small></span>{!item.isRead && <i />}</button>)}</div>
                      : <div className="notification-popover-message">You’re all caught up.</div>}
                <button className="notification-popover-footer" onClick={() => { setNotificationOpen(false); setView("notifications"); }}>Open notification center <span>→</span></button>
              </section>}
            </div>
            <button className="user-chip" onClick={() => setView("profile")}>
              {user.profileImage ? <img className="user-avatar-small user-avatar-photo" src={user.profileImage} alt="" /> : <span className="user-avatar-small">{avatar}</span>}
              <span className="user-chip-text"><strong>{greetingName}</strong><small>{user.role}</small></span>
              <Settings2 size={15} className="chip-settings" />
            </button>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
            <button className="top-icon top-logout" onClick={onLogout} disabled={loggingOut} aria-label={loggingOut ? "Signing out" : "Sign out"} title="Sign out"><LogOut size={17} /></button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
