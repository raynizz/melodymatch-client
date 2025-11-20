import { useTranslation } from "react-i18next";
import {
  PiInstagramLogoDuotone,
  PiSpotifyLogoDuotone,
  PiTelegramLogoDuotone,
  PiVinylRecordDuotone,
} from "react-icons/pi";
import "./Footer.css";

export default function Footer() {
  const { t } = useTranslation();

  const genres = ["neoSoul", "deepHouse", "indiePop"];

  const linkGroups = [
    {
      key: "product",
      title: t("footer.product"),
      items: [
        { key: "journey", label: t("footer.links.journey"), href: "/#features" },
        { key: "events", label: t("footer.links.events"), href: "/#community" },
        { key: "stories", label: t("footer.links.stories"), href: "/#community" },
      ],
    },
    {
      key: "company",
      title: t("footer.company"),
      items: [
        { key: "press", label: t("footer.links.press"), href: "mailto:press@melodymatch.fm" },
        { key: "careers", label: t("footer.links.careers"), href: "mailto:careers@melodymatch.fm" },
        { key: "contact", label: t("footer.links.contact"), href: "mailto:hello@melodymatch.fm" },
      ],
    },
    {
      key: "support",
      title: t("footer.support"),
      items: [
        { key: "help", label: t("footer.links.help"), href: "mailto:support@melodymatch.fm" },
        { key: "security", label: t("footer.links.security"), href: "mailto:trust@melodymatch.fm" },
        { key: "guidelines", label: t("footer.links.guidelines"), href: "/#community" },
      ],
    },
  ];

  const socialLinks = [
    {
      key: "instagram",
      icon: <PiInstagramLogoDuotone />,
      label: t("footer.social.instagram"),
    },
    {
      key: "telegram",
      icon: <PiTelegramLogoDuotone />,
      label: t("footer.social.telegram"),
    },
    {
      key: "spotify",
      icon: <PiSpotifyLogoDuotone />,
      label: t("footer.social.spotify"),
    },
  ];

  return (
    <footer className="app-footer">
      <div className="app-footer__grid">
        <div className="app-footer__brand">
          <div className="app-footer__logo">
            <PiVinylRecordDuotone />
          </div>
          <p className="app-footer__tagline">{t("footer.tagline")}</p>

          <div className="app-footer__chips" aria-label={t("footer.genresLabel")}>
            {genres.map((genre) => (
              <span key={genre}>{t(`footer.genres.${genre}`)}</span>
            ))}
          </div>
        </div>

        {linkGroups.map((group) => (
          <div key={group.key} className="app-footer__column">
            <p className="app-footer__column-title">{group.title}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.key}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="app-footer__bottom">
        <span>
          © {new Date().getFullYear()} MelodyMatch · {t("footer.rights")}
        </span>

        <div className="app-footer__social">
          {socialLinks.map((social) => (
            <button
              key={social.key}
              type="button"
              className="social-button"
              aria-label={social.label}
            >
              {social.icon}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
