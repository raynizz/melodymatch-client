import { useMemo } from "react";
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

  const availableOptions = useMemo(() => {
    const hasOtherGenders = normalizedValue.some((v) => v !== 0);
    if (hasOtherGenders) {
      return options.filter((opt) => Number(opt.value) !== 0);
    }
    return options;
  }, [normalizedValue, options]);

  const handleToggle = (optionValue) => {
    const numValue = Number(optionValue);
    const currentSet = new Set(normalizedValue);

    if (currentSet.has(numValue)) {
      currentSet.delete(numValue);
    } else {
      if (numValue === 0) {
        currentSet.clear();
        currentSet.add(0);
      } else {
        currentSet.delete(0);
        currentSet.add(numValue);
      }
    }

    onChange?.(Array.from(currentSet));
  };

  return (
    <div className={`form-field ${error ? "form-field--error" : ""}`}>
      {label && <label htmlFor={id}>{label}</label>}

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
