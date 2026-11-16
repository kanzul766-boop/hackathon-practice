import { useEffect } from "react";
import { CircleCheck, CircleX, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  const Icon = toast.type === "error" ? CircleX : CircleCheck;
  return (
    <div className={`toast toast-${toast.type || "success"}`} role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"}>
      <Icon size={19} />
      <span>{toast.message}</span>
      <button className="icon-button toast-close" onClick={onClose} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
