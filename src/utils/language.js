import i18n from "../i18n";

export const getActiveLanguage = () =>
  i18n.language && i18n.language.startsWith("uk") ? "uk" : "en";
