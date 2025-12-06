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
import NotificationBell from "../../components/notifications/NotificationBell";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { resolveAssetUrl } from "../../utils/url";
import { Roles } from "../../types/roles";
import "./Header.css";

export default function Header() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, currentMelodyUser, hasRole } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinks = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    if (hasRole?.(Roles.Admin)) {
      return [
        {
          key: "admin-complaints",
          label: t("nav.adminComplaints"),
          to: "/admin/complaints",
          type: "route",
        },
      ];
    }

    if (hasRole?.(Roles.Dater)) {
      return [
        { key: "match", label: t("nav.feed"), to: "/match", type: "route" },
        { key: "likes", label: t("nav.likes"), to: "/likes", type: "route" },
        { key: "chats", label: t("nav.chats"), to: "/chats", type: "route" },
      ];
    }

    return [];
  }, [hasRole, isAuthenticated, t]);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleLogout = (onNavigate) => {
    logout();
    onNavigate?.();
    navigate("/");
  };

  const profile = useMemo(() => {
    if (!user && !currentMelodyUser) return null;
    const rawAvatar =
      currentMelodyUser?.avatarUrl ??
      user?.avatarUrl ??
      user?.avatar ??
      user?.picture ??
      user?.profileImage ??
      null;
    const avatar = resolveAssetUrl(rawAvatar);
    const displayName =
      currentMelodyUser?.identityUser?.userName ??
      currentMelodyUser?.identityUser?.email ??
      user?.preferred_username ??
      user?.userName ??
      user?.name ??
      user?.email ??
      "";
    const initials = displayName ? displayName[0].toUpperCase() : "M";

    return { avatar, displayName, initials };
  }, [currentMelodyUser, user]);

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
      {isAuthenticated && (
        <NotificationBell isAuthenticated={isAuthenticated} />
      )}
      {isAuthenticated ? (
        <div className="app-header__user">
          {(hasRole?.(Roles.Dater) || hasRole?.(Roles.Admin)) && (
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
          )}
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
            <span className="brand-pill">{t("header.status")}</span>
          </Link>
        </div>

        {navLinks.length > 0 && (
          <nav className="app-header__nav app-header__nav--desktop" aria-label={t("nav.aria")}>
            {renderNavLinks()}
          </nav>
        )}

        <div className="app-header__actions app-header__actions--desktop">
          {actionControls()}
        </div>

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

        {navLinks.length > 0 && (
          <nav className="app-header__nav app-header__nav--mobile" aria-label={t("nav.aria")}>
            {renderNavLinks(closeMenu)}
          </nav>
        )}

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
