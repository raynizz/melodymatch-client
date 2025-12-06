import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "./AuthLayout";
import Button from "../../components/ui/Button";
import FeedbackPopup from "../../components/ui/FeedbackPopup";
import { FormField, PasswordField } from "../../components/forms";
import { loginRequest } from "../../api/authService";
import { useAuth } from "../../contexts/AuthContext";
import { extractApiError } from "../../utils/apiError";
import { createLoginSchema } from "../../utils/validationSchemas";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const schema = useMemo(() => createLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await loginRequest(data);
      login(response.access_token, response.refresh_token);
      navigate("/");
    } catch (exception) {
      const apiMessage =
        extractApiError(exception) || t("auth.errors.invalidCredentials");
      setPopupMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  const helper = (
    <p>
      {t("auth.login.helper")}{" "}
      <Link to="/register">{t("auth.login.helperCta")}</Link>
    </p>
  );

  return (
    <AuthLayout
      eyebrow={t("auth.login.eyebrow")}
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      helper={helper}
    >
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="username"
          label={t("auth.login.usernameLabel")}
          placeholder={t("auth.login.usernamePlaceholder")}
          error={errors.username?.message}
          required
          {...register("username")}
        />

        <PasswordField
          id="password"
          label={t("auth.login.passwordLabel")}
          placeholder={t("auth.login.passwordPlaceholder")}
          error={errors.password?.message}
          required
          {...register("password")}
        />

        <div className="form-actions">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? t("auth.common.loading") : t("auth.login.submit")}
          </Button>
        </div>
      </form>
      <FeedbackPopup
        open={Boolean(popupMessage)}
        title={t("auth.errors.invalidCredentials")}
        message={popupMessage}
        onClose={() => setPopupMessage("")}
      />
    </AuthLayout>
  );
}
