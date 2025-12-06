import Button from "../ui/Button";
import "./ActionModal.css";

export default function ActionModal({
  open,
  title,
  description,
  value,
  placeholder,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
  cancelLabel,
  busy,
}) {
  if (!open) return null;

  return (
    <div className="action-modal" role="dialog" aria-modal="true">
      <div className="action-modal__card">
        <header>
          <p className="eyebrow">{title}</p>
          {description && <p className="helper">{description}</p>}
        </header>

        <label className="action-modal__field">
          <span>{placeholder}</span>
          <textarea
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
          />
        </label>

        <div className="action-modal__actions">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={busy}>
            {busy ? "..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
