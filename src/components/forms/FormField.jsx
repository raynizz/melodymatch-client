import { forwardRef } from "react";
import "./FormField.css";

/**
 * Reusable form field component with integrated error display
 * @param {Object} props
 * @param {string} props.label - Label text for the input
 * @param {string} props.error - Error message to display
 * @param {string} props.id - ID for the input element
 * @param {string} [props.type="text"] - Input type
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {React.Ref} ref - Forward ref to the input element
 */
const FormField = forwardRef(
  (
    {
      label,
      error,
      id,
      type = "text",
      placeholder,
      required = false,
      ...rest
    },
    ref
  ) => {
    return (
      <div className={`form-field ${error ? "form-field--error" : ""}`}>
        <label htmlFor={id}>
          {label}
          {required && <span className="form-field__required"> *</span>}
        </label>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        {error && (
          <p id={`${id}-error`} className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export default FormField;
