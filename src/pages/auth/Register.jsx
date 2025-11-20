import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "./AuthLayout";
import Button from "../../components/ui/Button";
import FeedbackPopup from "../../components/ui/FeedbackPopup";
import { FormField, PasswordField } from "../../components/forms";
import { registerAccount } from "../../api/accountService";
import { extractApiError } from "../../utils/apiError";
import { createRegisterSchema } from "../../utils/validationSchemas";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [success, setSuccess] = useState("");

  const schema = useMemo(() => createRegisterSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    setSuccess("");
    setLoading(true);
    try {
      await registerAccount({
        userName: data.userName,
        emailAddress: data.emailAddress,
        password: data.password,
      });
      setSuccess(t("auth.register.success"));
      reset();
      setTimeout(() => navigate("/login"), 900);
    } catch (exception) {
      const apiMessage =
        extractApiError(exception) || t("auth.errors.registrationFailed");
      setPopupMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  const helper = (
    <p>
      {t("auth.register.helper")}{" "}
      <Link to="/login">{t("auth.register.helperCta")}</Link>
    </p>
  );

  return (
    <>
      <AuthLayout
        eyebrow={t("auth.register.eyebrow")}
        title={t("auth.register.title")}
        subtitle={t("auth.register.subtitle")}
        helper={helper}
      >
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            id="userName"
            label={t("auth.register.usernameLabel")}
            placeholder={t("auth.register.usernamePlaceholder")}
            error={errors.userName?.message}
            required
            {...register("userName")}
          />

          <FormField
            id="emailAddress"
            type="email"
            label={t("auth.register.emailLabel")}
            placeholder={t("auth.register.emailPlaceholder")}
            error={errors.emailAddress?.message}
            required
            {...register("emailAddress")}
          />

          <PasswordField
            id="password"
            label={t("auth.register.passwordLabel")}
            placeholder={t("auth.register.passwordPlaceholder")}
            error={errors.password?.message}
            required
            {...register("password")}
          />

          <PasswordField
            id="confirmPassword"
            label={t("auth.register.confirmPasswordLabel")}
            placeholder={t("auth.register.confirmPasswordPlaceholder")}
            error={errors.confirmPassword?.message}
            required
            {...register("confirmPassword")}
          />

          {success && <p className="form-success">{success}</p>}

          <div className="form-actions">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? t("auth.common.loading") : t("auth.register.submit")}
            </Button>
          </div>
        </form>
      </AuthLayout>
      <FeedbackPopup
        open={Boolean(popupMessage)}
        title={t("auth.errors.registrationFailed")}
        message={popupMessage}
        onClose={() => setPopupMessage("")}
      />
    </>
  );
}
