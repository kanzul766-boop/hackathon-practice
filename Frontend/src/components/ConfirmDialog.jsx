import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const closeTimer = useRef(null);
  const busyRef = useRef(busy);
  const closingRef = useRef(false);
  busyRef.current = busy;

  useEffect(() => {
    const previousFocus = document.activeElement;
    document.body.classList.add("dialog-open");
    confirmRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busyRef.current) close();
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll("button:not(:disabled)");
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("dialog-open");
      window.clearTimeout(closeTimer.current);
      previousFocus?.focus?.();
    };
  }, []);

  function close() {
    if (busyRef.current || closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = window.setTimeout(onCancel, 160);
  }

  return (
    <div
      className={`confirm-backdrop ${closing ? "confirm-closing" : ""}`}
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section
        className="confirm-dialog"
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <button className="icon-button confirm-close" onClick={close} disabled={busy} aria-label="Close confirmation">
          <X size={17} />
        </button>
        <span className={`confirm-icon ${destructive ? "confirm-icon-danger" : ""}`}><AlertTriangle size={20} /></span>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="button button-soft" onClick={close} disabled={busy}>Keep it</button>
          <button
            ref={confirmRef}
            className={`button ${destructive ? "button-danger" : "button-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <span className="spinner" /> : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
