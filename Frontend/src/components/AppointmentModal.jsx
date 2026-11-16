import { useEffect, useRef, useState } from "react";
import { CalendarDays, Clock3, X } from "lucide-react";
import { api, jsonBody } from "../api.js";

export default function AppointmentModal({ doctor, onClose, onBooked, notify }) {
  const [availability, setAvailability] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [closing, setClosing] = useState(false);
  const submitting = useRef(false);
  const fetchingAvailability = useRef(false);
  const closeTimer = useRef(null);
  const closingRef = useRef(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    document.body.classList.add("dialog-open");
    loadAvailability();
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !submitting.current) close();
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll("button:not(:disabled), input:not(:disabled), textarea:not(:disabled)");
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
  }, [doctor.id]);

  async function loadAvailability() {
    if (fetchingAvailability.current) return;
    fetchingAvailability.current = true;
    setLoadingAvailability(true);
    setError("");
    try {
      const result = await api(`/doctors/${doctor.id}/availability`);
      if (!result.availability) {
        setError("This doctor hasn’t added availability yet.");
      } else {
        setAvailability(result.availability);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      fetchingAvailability.current = false;
      setLoadingAvailability(false);
    }
  }

  function close() {
    if (submitting.current || closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 170);
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const selectedDate = new Date(`${date}T00:00:00`);
    if (availability) {
      const weekday = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
      if (!availability.availableDays.includes(weekday)) {
        setError("Choose a date on one of this doctor’s available days.");
        return;
      }
      if (time < availability.startTime || time >= availability.endTime) {
        setError("Choose a time within the doctor’s hours. The end time is not included.");
        return;
      }
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api("/appointments", {
        method: "POST",
        body: jsonBody({ doctorId: doctor.id, date, time, reason }),
      });
      notify(result.notificationWarning || "Appointment request sent to your doctor.", result.notificationWarning ? "error" : "success");
      onBooked();
      submitting.current = false;
      close();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return (
    <div className={`modal-backdrop ${closing ? "modal-closing" : ""}`} onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="booking-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button ref={closeButtonRef} className="icon-button modal-close" onClick={close} disabled={busy} aria-label="Close"><X size={19} /></button>
        <div className="modal-doctor">
          <img src={doctor.image} alt="" />
          <div><span className="eyebrow">YOUR VISIT</span><h2 id="booking-title">Book with {doctor.name}</h2><p>{doctor.specialization}</p></div>
        </div>
        {loadingAvailability ? <div className="modal-loading"><span className="spinner" /> Checking availability…</div> : error ? (
          <div className="modal-error" role="alert"><span>{error}</span><button className="button button-soft" onClick={loadAvailability} disabled={loadingAvailability}>{loadingAvailability ? <span className="spinner" /> : "Try again"}</button></div>
        ) : (
          <>
            {availability
              ? <div className="availability-banner"><CalendarDays size={17} /><span>{availability.availableDays.join(" · ")} <b>{availability.startTime}–{availability.endTime}</b></span></div>
              : <div className="availability-banner"><CalendarDays size={17} /><span>This doctor has not set weekly hours. Pick a future date and time.</span></div>}
            <form className="modal-form" onSubmit={submit}>
              <label className="field-label">Choose a date<input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} required /></label>
              <label className="field-label">Preferred time<input type="time" min={availability?.startTime} max={availability?.endTime} value={time} onChange={(e) => setTime(e.target.value)} required /></label>
              <label className="field-label">What would you like help with?<textarea rows="3" maxLength="500" placeholder="Share a little about your visit..." value={reason} onChange={(e) => setReason(e.target.value)} required /><small>This may flag a clear specialty mismatch; it is not used to diagnose you.</small></label>
              {error && <div className="form-alert" role="alert">{error}</div>}
              <button className="button button-primary full-button" disabled={busy}>{busy ? <span className="spinner" /> : <><Clock3 size={16} /> Request appointment</>}</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
