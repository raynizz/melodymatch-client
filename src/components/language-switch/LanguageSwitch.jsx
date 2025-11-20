import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "react-i18next";
import { PiCheckCircleFill, PiTranslateBold } from "react-icons/pi";
import "./LanguageSwitch.css";

export default function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage?.startsWith("uk") ? "uk" : "en";

  const languages = [
    { code: "en", label: "English" },
    { code: "uk", label: "Українська" },
  ];

  const handleSelect = (code) => {
    if (code !== activeLanguage) {
      i18n.changeLanguage(code);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="lang-switch"
        aria-label={t("languageSwitch.label")}
      >
        <PiTranslateBold aria-hidden />
        <span>{activeLanguage.toUpperCase()}</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="lang-dropdown"
          align="end"
          sideOffset={8}
        >
          {languages.map((language) => (
            <DropdownMenu.Item
              key={language.code}
              className={`lang-option ${
                activeLanguage === language.code ? "lang-option--active" : ""
              }`}
              onSelect={() => handleSelect(language.code)}
            >
              <span>{language.label}</span>
              {activeLanguage === language.code && (
                <PiCheckCircleFill aria-hidden />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
