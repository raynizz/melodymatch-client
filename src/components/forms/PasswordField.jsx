import { forwardRef, useState } from "react";
import { PiEyeBold, PiEyeSlashBold } from "react-icons/pi";
import { useTranslation } from "react-i18next";
import "./PasswordField.css";

/**
 * Password field with visibility toggle
 * @param {Object} props
 * @param {string} props.label - Label text for the input
 * @param {string} props.error - Error message to display
 * @param {string} props.id - ID for the input element
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {React.Ref} ref - Forward ref to the input element
 */
const PasswordField = forwardRef(
  ({ label, error, id, placeholder, required = false, ...rest }, ref) => {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className={`form-field ${error ? "form-field--error" : ""}`}>
        <label htmlFor={id}>
          {label}
          {required && <span className="form-field__required"> *</span>}
        </label>
        <div className="input-control">
          <input
            id={id}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            {...rest}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={t(
              showPassword ? "auth.common.hide" : "auth.common.show"
            )}
          >
            {showPassword ? (
              <PiEyeSlashBold aria-hidden />
            ) : (
              <PiEyeBold aria-hidden />
            )}
            <span className="sr-only">
              {t(showPassword ? "auth.common.hide" : "auth.common.show")}
            </span>
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";

export default PasswordField;
