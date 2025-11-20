import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  LuHeartHandshake,
  LuMusic4,
  LuRadio,
  LuSparkles,
} from "react-icons/lu";
import {
  PiHeadphonesDuotone,
  PiVinylRecordDuotone,
  PiWaveformBold,
} from "react-icons/pi";
import Layout from "../../layout/layout/Layout";
import "./Home.css";

export default function Home() {
  const { t } = useTranslation();

  const stats = [
    { key: "matches", value: "2.4M+", label: t("home.stats.matches") },
    { key: "artists", value: "12K", label: t("home.stats.artists") },
    { key: "events", value: "68", label: t("home.stats.events") },
  ];

  const heroTracks = [
    {
      key: "twilight",
      title: t("home.hero.tracks.twilight.title"),
      mood: t("home.hero.tracks.twilight.mood"),
      bpm: "92 BPM",
    },
    {
      key: "club",
      title: t("home.hero.tracks.club.title"),
      mood: t("home.hero.tracks.club.mood"),
      bpm: "124 BPM",
    },
    {
      key: "sunrise",
      title: t("home.hero.tracks.sunrise.title"),
      mood: t("home.hero.tracks.sunrise.mood"),
      bpm: "108 BPM",
    },
  ];

  const features = [
    {
      key: "discovery",
      icon: <LuSparkles />,
      title: t("home.features.discovery.title"),
      description: t("home.features.discovery.description"),
    },
    {
      key: "rooms",
      icon: <LuMusic4 />,
      title: t("home.features.rooms.title"),
      description: t("home.features.rooms.description"),
    },
    {
      key: "events",
      icon: <LuRadio />,
      title: t("home.features.events.title"),
      description: t("home.features.events.description"),
    },
    {
      key: "safety",
      icon: <LuHeartHandshake />,
      title: t("home.features.safety.title"),
      description: t("home.features.safety.description"),
    },
  ];

  const communityHighlights = [
    {
      key: "kyiv",
      icon: <PiVinylRecordDuotone />,
      title: t("home.community.cards.kyiv.title"),
      description: t("home.community.cards.kyiv.description"),
      meta: t("home.community.cards.kyiv.meta"),
    },
    {
      key: "warsaw",
      icon: <PiHeadphonesDuotone />,
      title: t("home.community.cards.warsaw.title"),
      description: t("home.community.cards.warsaw.description"),
      meta: t("home.community.cards.warsaw.meta"),
    },
    {
      key: "lisbon",
      icon: <PiWaveformBold />,
      title: t("home.community.cards.lisbon.title"),
      description: t("home.community.cards.lisbon.description"),
      meta: t("home.community.cards.lisbon.meta"),
    },
  ];

  return (
    <Layout>
      <div className="home">
        <section className="hero" id="hero">
          <div className="hero__content">
            <p className="hero__eyebrow">{t("home.hero.eyebrow")}</p>
            <h1>{t("home.hero.title")}</h1>
            <p className="hero__description">{t("home.hero.description")}</p>

            <div className="home-cta">
              <Link to="/register" className="home-cta__primary">
                {t("home.hero.primaryCta")}
              </Link>
              <a href="#community" className="home-cta__secondary">
                {t("home.hero.secondaryCta")}
              </a>
            </div>
            <p className="home-cta__note">{t("home.hero.note")}</p>

            <dl className="hero__stats">
              {stats.map((stat) => (
                <div key={stat.key}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hero__panel" aria-label={t("home.hero.panelLabel")}>
            <div className="hero__panel-header">
              <div>
                <p className="panel-eyebrow">{t("home.hero.panelEyebrow")}</p>
                <p className="panel-title">{t("home.hero.panelTitle")}</p>
              </div>
              <span className="panel-status">{t("home.hero.liveStatus")}</span>
            </div>

            <ul className="hero__tracks">
              {heroTracks.map((track) => (
                <li key={track.key}>
                  <div>
                    <p className="track-title">{track.title}</p>
                    <p className="track-mood">{track.mood}</p>
                  </div>
                  <span>{track.bpm}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <p className="section-eyebrow">{t("home.features.eyebrow")}</p>
            <h2>{t("home.features.title")}</h2>
            <p className="section-description">{t("home.features.subtitle")}</p>
          </div>

          <div className="features__grid">
            {features.map((feature) => (
              <article key={feature.key} className="feature-card">
                <span className="feature-icon" aria-hidden>
                  {feature.icon}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="community" id="community">
          <div className="section-heading">
            <p className="section-eyebrow">{t("home.community.eyebrow")}</p>
            <h2>{t("home.community.title")}</h2>
            <p className="section-description">
              {t("home.community.subtitle")}
            </p>
          </div>

          <div className="community__cards">
            {communityHighlights.map((card) => (
              <article key={card.key} className="community-card">
                <span className="community-card__icon" aria-hidden>
                  {card.icon}
                </span>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
                <span className="community-card__meta">{card.meta}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
