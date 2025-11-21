import { useMemo } from "react";
import { PiXBold } from "react-icons/pi";
import "./PreferredGendersSelect.css";

export default function PreferredGendersSelect({
  id,
  label,
  error,
  options = [],
  value = [],
  onChange,
  disabled = false,
}) {
  const normalizedValue = useMemo(() => {
    return Array.isArray(value)
      ? value.map((item) =>
          item === null || item === undefined ? 0 : Number(item)
        )
      : [];
  }, [value]);

  // Filter options to exclude NotSpecified (0) if other genders are selected
  const availableOptions = useMemo(() => {
    const hasOtherGenders = normalizedValue.some((v) => v !== 0);
    if (hasOtherGenders) {
      return options.filter((opt) => Number(opt.value) !== 0);
    }
    return options;
  }, [normalizedValue, options]);

  const selectedOptions = useMemo(() => {
    return availableOptions.filter((opt) =>
      normalizedValue.includes(Number(opt.value))
    );
  }, [availableOptions, normalizedValue]);

  const handleToggle = (optionValue) => {
    const numValue = Number(optionValue);
    const currentSet = new Set(normalizedValue);

    if (currentSet.has(numValue)) {
      currentSet.delete(numValue);
    } else {
      // If selecting NotSpecified (0), clear all other selections
      if (numValue === 0) {
        currentSet.clear();
        currentSet.add(0);
      } else {
        // If selecting other gender, remove NotSpecified
        currentSet.delete(0);
        currentSet.add(numValue);
      }
    }

    onChange?.(Array.from(currentSet));
  };

  const handleRemove = (optionValue) => {
    const numValue = Number(optionValue);
    const next = normalizedValue.filter((v) => v !== numValue);
    onChange?.(next);
  };

  return (
    <div className={`form-field ${error ? "form-field--error" : ""}`}>
      {label && <label htmlFor={id}>{label}</label>}
      
      {selectedOptions.length > 0 && (
        <div className="preferred-genders__chips" role="group" aria-label={label}>
          {selectedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="preferred-genders__chip"
              onClick={() => handleRemove(option.value)}
              disabled={disabled}
              aria-label={`Remove ${option.label}`}
            >
              <span>{option.label}</span>
              <PiXBold aria-hidden />
            </button>
          ))}
        </div>
      )}

      <div className="preferred-genders__options" id={id}>
        {availableOptions.map((option) => {
          const numValue = Number(option.value);
          const isSelected = normalizedValue.includes(numValue);
          
          return (
            <button
              key={option.value}
              type="button"
              className={`preferred-genders__option ${
                isSelected ? "preferred-genders__option--selected" : ""
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
