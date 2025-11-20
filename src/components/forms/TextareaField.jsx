import { forwardRef } from "react";
import "./FormField.css";

/**
 * Reusable textarea field component with integrated error display
 * @param {Object} props
 * @param {string} props.label - Label text for the textarea
 * @param {string} props.error - Error message to display
 * @param {string} props.id - ID for the textarea element
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {number} [props.rows=4] - Number of visible text rows
 * @param {React.Ref} ref - Forward ref to the textarea element
 */
const TextareaField = forwardRef(
  (
    {
      label,
      error,
      id,
      placeholder,
      required = false,
      rows = 4,
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
        <textarea
          id={id}
          placeholder={placeholder}
          rows={rows}
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

TextareaField.displayName = "TextareaField";

export default TextareaField;
