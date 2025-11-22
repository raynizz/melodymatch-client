import { useMemo } from "react";
import "./InterestsSelect.css";

export default function InterestsSelect({
  id,
  label,
  helper,
  error,
  options = [],
  value = [],
  onChange,
  disabled = false,
}) {
  const normalizedValue = useMemo(() => {
    return Array.isArray(value)
      ? value
          .map((item) =>
            item === null || item === undefined ? null : Number(item)
          )
          .filter((item) => item !== null && !Number.isNaN(item))
      : [];
  }, [value]);

  const handleToggle = (optionValue) => {
    const numValue = Number(optionValue);
    const currentSet = new Set(normalizedValue);

    if (currentSet.has(numValue)) {
      currentSet.delete(numValue);
    } else {
      currentSet.add(numValue);
    }

    onChange?.(Array.from(currentSet));
  };

  return (
    <div className={`form-field interests-select ${error ? "form-field--error" : ""}`}>
      {label && <label htmlFor={id}>{label}</label>}
      {helper && <p className="interests-select__helper">{helper}</p>}

      <div className="interests-select__options" id={id}>
        {options.map((option) => {
          const numValue = Number(option.value);
          const isSelected = normalizedValue.includes(numValue);
          return (
            <button
              key={option.value}
              type="button"
              className={`interests-select__option ${
                isSelected ? "interests-select__option--selected" : ""
              }`}
              onClick={() => handleToggle(option.value)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
