import { useMemo } from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { PiCheckBold } from "react-icons/pi";
import "./GenderSelect.css";

export default function GenderSelect({
  id,
  label,
  error,
  options = [],
  value,
  onChange,
  disabled = false,
}) {
  const normalizedValue = useMemo(() => {
    if (value === null || value === undefined) {
      return "0";
    }
    return String(value);
  }, [value]);

  const handleValueChange = (newValue) => {
    onChange?.(Number(newValue));
  };

  return (
    <div className={`form-field ${error ? "form-field--error" : ""}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <RadioGroup.Root
        className="gender-select"
        value={normalizedValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        id={id}
      >
        {options.map((option) => (
          <div key={option.value} className="gender-select__option">
            <RadioGroup.Item
              className="gender-select__radio"
              value={String(option.value)}
              id={`${id}-${option.value}`}
            >
              <RadioGroup.Indicator className="gender-select__indicator">
                <PiCheckBold aria-hidden />
              </RadioGroup.Indicator>
            </RadioGroup.Item>
            <label
              className="gender-select__label"
              htmlFor={`${id}-${option.value}`}
            >
              {option.label}
            </label>
          </div>
        ))}
      </RadioGroup.Root>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
