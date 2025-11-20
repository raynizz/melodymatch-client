import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function SettingsBar() {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  return (
    <div style={{
      display: "flex",
      gap: "16px",
      padding: "12px",
      borderBottom: "1px solid #ccc",
      alignItems: "center"
    }}>
      <button onClick={toggleTheme}>
        {i18n.t("toggleTheme")}: {theme}
      </button>

      <button onClick={() => i18n.changeLanguage("en")}>EN</button>
      <button onClick={() => i18n.changeLanguage("uk")}>UK</button>

      <Link to="/login">{i18n.t("login")}</Link>
      <Link to="/register">{i18n.t("register")}</Link>
    </div>
  );
}
