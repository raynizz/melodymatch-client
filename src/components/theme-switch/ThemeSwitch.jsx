import * as Switch from "@radix-ui/react-switch";
import { useTranslation } from "react-i18next";
import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";
import "./ThemeSwitch.css";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const isDark = theme === "dark";

  return (
    <Switch.Root
      className={`theme-switch ${isDark ? "theme-switch--dark" : ""}`}
      checked={isDark}
      onCheckedChange={toggleTheme}
      aria-label={t("toggleTheme")}
    >
      <div className="theme-switch__icons">
        <FiSun aria-hidden />
        <FiMoon aria-hidden />
      </div>
      <Switch.Thumb className="theme-switch__thumb">
        {isDark ? <FiMoon aria-hidden /> : <FiSun aria-hidden />}
      </Switch.Thumb>
    </Switch.Root>
  );
}
