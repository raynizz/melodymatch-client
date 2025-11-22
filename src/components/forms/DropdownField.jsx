import { useMemo } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { PiCaretDownBold, PiCheckBold } from "react-icons/pi";
import "./DropdownField.css";

export default function DropdownField({
  id,
  label,
  error,
  options = [],
  value,
  onChange,
  isMulti = false,
  placeholder = "",
  disabled = false,
}) {
  const normalizedOptions = useMemo(
    () =>
      options.map((option) => ({
        value: String(option.value ?? option),
        label: option.label ?? String(option.value ?? option),
      })),
    [options]
  );

  const normalizedValue = useMemo(() => {
    if (isMulti) {
      return Array.isArray(value)
        ? value.map((item) =>
            item === null || item === undefined ? "" : String(item)
          )
        : [];
    }
    if (value === null || value === undefined) {
      return "";
    }
    return String(value);
  }, [isMulti, value]);

  const selectedLabels = useMemo(() => {
    if (isMulti) {
      return normalizedOptions
        .filter((option) => normalizedValue.includes(option.value))
        .map((option) => option.label);
    }
    const match = normalizedOptions.find(
      (option) => option.value === normalizedValue
    );
    return match ? [match.label] : [];
  }, [isMulti, normalizedOptions, normalizedValue]);

  const displayText = useMemo(() => {
    if (isMulti) {
      return selectedLabels.length
        ? selectedLabels.join(", ")
        : placeholder || "-";
    }
    if (selectedLabels.length) {
      return selectedLabels[0];
    }
    return placeholder || (normalizedOptions[0]?.label ?? "-");
  }, [isMulti, normalizedOptions, placeholder, selectedLabels]);

  const handleCheckboxChange = (optionValue, checked) => {
    const current = new Set(normalizedValue);
    if (checked) {
      current.add(optionValue);
    } else {
      current.delete(optionValue);
    }
    onChange?.(Array.from(current));
  };

  const handleRadioChange = (nextValue) => {
    onChange?.(nextValue);
  };

  return (
    <div className={`form-field ${error ? "form-field--error" : ""}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild disabled={disabled}>
          <button
            type="button"
            className={`dropdown-field__trigger ${disabled ? "is-disabled" : ""}`}
            id={id}
          >
            <span className="dropdown-field__label">{displayText}</span>
            <PiCaretDownBold aria-hidden />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="dropdown-field__content"
            align="start"
            sideOffset={8}
          >
            {isMulti ? (
              normalizedOptions.map((option) => (
                <DropdownMenu.CheckboxItem
                  key={option.value}
                  className="dropdown-field__item"
                  checked={normalizedValue.includes(option.value)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(option.value, Boolean(checked))
                  }
                >
                  <DropdownMenu.ItemIndicator>
                    <PiCheckBold aria-hidden />
                  </DropdownMenu.ItemIndicator>
                  {option.label}
                </DropdownMenu.CheckboxItem>
              ))
            ) : (
              <DropdownMenu.RadioGroup
                value={normalizedValue}
                onValueChange={handleRadioChange}
              >
                {normalizedOptions.map((option) => (
                  <DropdownMenu.RadioItem
                    key={option.value}
                    className="dropdown-field__item"
                    value={option.value}
                  >
                    <DropdownMenu.ItemIndicator>
                      <PiCheckBold aria-hidden />
                    </DropdownMenu.ItemIndicator>
                    {option.label}
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
