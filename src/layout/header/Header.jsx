import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PiListBold,
  PiUserCircleBold,
  PiWaveformBold,
  PiXBold,
  PiSignOutBold,
} from "react-icons/pi";
import LanguageSwitch from "../../components/language-switch/LanguageSwitch";
import ThemeSwitch from "../../components/theme-switch/ThemeSwitch";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import "./Header.css";

export default function Header() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinks = [
    { key: "home", label: t("nav.home"), to: "/", type: "route" },
    { key: "features", label: t("nav.features"), to: "#features", type: "anchor" },
    { key: "community", label: t("nav.community"), to: "#community", type: "anchor" },
  ];

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleLogout = (onNavigate) => {
    logout();
    onNavigate?.();
    navigate("/");
  };

  const profile = useMemo(() => {
    if (!user) return null;
    const avatar =
      user.avatarUrl ??
      user.avatar ??
      user.picture ??
      user.profileImage ??
      null;
    const displayName =
      user.preferred_username ??
      user.userName ??
      user.name ??
      user.email ??
      "";
    const initials = displayName ? displayName[0].toUpperCase() : "M";

    return { avatar, displayName, initials };
  }, [user]);

  const renderNavLinks = (onNavigate) =>
    navLinks.map((link) =>
      link.type === "anchor" ? (
        <a key={link.key} href={link.to} onClick={onNavigate}>
          {link.label}
        </a>
      ) : (
        <Link key={link.key} to={link.to} onClick={onNavigate}>
          {link.label}
        </Link>
      )
    );

  const actionControls = (onNavigate) => (
    <>
      <LanguageSwitch />
      <ThemeSwitch />
      {isAuthenticated ? (
        <div className="app-header__user">
          <Link
            to="/profile"
            className="user-avatar"
            aria-label={t("header.profileLink")}
            onClick={onNavigate}
          >
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile.displayName || ""} />
            ) : (
              <PiUserCircleBold className="user-avatar__icon" aria-hidden />
            )}
          </Link>
          <Button
            variant="ghost"
            size="md"
            onClick={() => handleLogout(onNavigate)}
          >
            <PiSignOutBold className="logout__icon" aria-hidden/>
            {/* {t("header.logout")} */}
          </Button>
        </div>
      ) : (
        <>
          <Button to="/login" variant="ghost" size="md" onClick={onNavigate}>
            {t("nav.login")}
          </Button>
          <Button to="/register" size="md" onClick={onNavigate}>
            {t("nav.register")}
          </Button>
        </>
      )}
    </>
  );

  return (
    <>
      <header className={`app-header ${isMenuOpen ? "menu-open" : ""}`}>
        <div className="app-header__brand">
          <Link to="/" className="app-header__brand-link" onClick={closeMenu}>
            <span className="app-header__logo" aria-hidden>
              <PiWaveformBold />
            </span>
            <div className="app-header__identity">
              <span className="brand-title">MelodyMatch</span>
              <span className="brand-subtitle">{t("header.tagline")}</span>
            </div>
          </Link>

          <span className="brand-pill">{t("header.status")}</span>

          <button
            type="button"
            className="app-header__menu-toggle"
            aria-label={
              isMenuOpen ? t("header.menuClose") : t("header.menuOpen")
            }
            aria-expanded={isMenuOpen}
            onClick={toggleMenu}
          >
            {isMenuOpen ? <PiXBold aria-hidden /> : <PiListBold aria-hidden />}
          </button>
        </div>

        <nav className="app-header__nav app-header__nav--desktop" aria-label={t("nav.aria")}>
          {renderNavLinks()}
        </nav>

        <div className="app-header__actions app-header__actions--desktop">
          {actionControls()}
        </div>
      </header>

      <aside
        className={`app-header__drawer ${isMenuOpen ? "is-open" : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="app-header__drawer-head">
          <p>{t("header.drawerTitle")}</p>
          <button
            type="button"
            className="drawer-close"
            onClick={closeMenu}
            aria-label={t("header.menuClose")}
          >
            <PiXBold aria-hidden />
          </button>
        </div>

        <nav className="app-header__nav app-header__nav--mobile" aria-label={t("nav.aria")}>
          {renderNavLinks(closeMenu)}
        </nav>

        <div className="app-header__actions app-header__actions--mobile">
          {actionControls(closeMenu)}
        </div>
      </aside>

      {isMenuOpen && (
        <button
          type="button"
          className="app-header__backdrop"
          aria-label={t("header.menuClose")}
          onClick={closeMenu}
        />
      )}
    </>
  );
}
