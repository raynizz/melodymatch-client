import { PiWarningCircleBold, PiCheckCircleBold } from "react-icons/pi";
import "./FeedbackPopup.css";

export default function FeedbackPopup({
  open,
  title,
  message,
  variant = "error",
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      className="feedback-popup__container"
      role="status"
      aria-live="assertive"
    >
      <div className={`feedback-popup feedback-popup--${variant}`}>
        <div className="feedback-popup__icon">
          {variant === "error" ? (
            <PiWarningCircleBold aria-hidden />
          ) : (
            <PiCheckCircleBold aria-hidden />
          )}
        </div>
        <div className="feedback-popup__body">
          {title && <p className="feedback-popup__title">{title}</p>}
          {message && <p>{message}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            className="feedback-popup__close"
            onClick={onClose}
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
