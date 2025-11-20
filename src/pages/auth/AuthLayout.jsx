import { useTranslation } from "react-i18next";
import Layout from "../../layout/layout/Layout";
import "./Auth.css";

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  helper,
  children,
}) {
  const { t } = useTranslation();

  const highlights = [
    t("auth.preview.points.discovery"),
    t("auth.preview.points.events"),
    t("auth.preview.points.safety"),
  ];

  return (
    <Layout>
      <div className="auth-page">
        <section className="auth-card">
          {eyebrow && <p className="auth-eyebrow">{eyebrow}</p>}
          {title && <h1>{title}</h1>}
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          <div className="auth-card__body">{children}</div>
          {helper && <div className="auth-helper">{helper}</div>}
        </section>

        <aside className="auth-spotlight">
          <p className="auth-spotlight__eyebrow">
            {t("auth.preview.eyebrow")}
          </p>
          <h3>{t("auth.preview.title")}</h3>
          <p>{t("auth.preview.description")}</p>
          <ul>
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </Layout>
  );
}
