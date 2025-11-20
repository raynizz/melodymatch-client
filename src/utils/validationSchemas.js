import { z } from "zod";

/**
 * Validation schemas using Zod
 * These schemas are reusable and provide type-safe validation
 */

/**
 * Helper function to check if string contains Cyrillic characters
 */
function hasCyrillic(value) {
  return /[\u0400-\u04FF]/.test(value);
}

/**
 * Login form validation schema
 * @param {Function} t - Translation function from i18next
 * @returns {z.ZodObject} Zod schema for login form
 */
export function createLoginSchema(t) {
  return z.object({
    username: z
      .string()
      .min(1, { message: t("auth.errors.required") })
      .refine((val) => !hasCyrillic(val), {
        message: t("auth.errors.noCyrillic"),
      }),
    password: z
      .string()
      .min(1, { message: t("auth.errors.required") })
      .refine((val) => !hasCyrillic(val), {
        message: t("auth.errors.noCyrillic"),
      }),
  });
}

/**
 * Registration form validation schema
 * @param {Function} t - Translation function from i18next
 * @returns {z.ZodObject} Zod schema for registration form
 */
export function createRegisterSchema(t) {
  return z
    .object({
      userName: z
        .string()
        .min(1, { message: t("auth.errors.required") })
        .refine((val) => !hasCyrillic(val), {
          message: t("auth.errors.noCyrillic"),
        }),
      emailAddress: z
        .string()
        .min(1, { message: t("auth.errors.required") })
        .email({ message: t("auth.errors.emailInvalid") })
        .refine((val) => !hasCyrillic(val), {
          message: t("auth.errors.noCyrillic"),
        }),
      password: z
        .string()
        .min(1, { message: t("auth.errors.required") })
        .refine((val) => !hasCyrillic(val), {
          message: t("auth.errors.noCyrillic"),
        })
        .refine((val) => /[0-9]/.test(val), {
          message: t("auth.errors.passwordRequiresDigit"),
        })
        .refine((val) => /[a-z]/.test(val), {
          message: t("auth.errors.passwordRequiresLowercase"),
        })
        .refine((val) => /[A-Z]/.test(val), {
          message: t("auth.errors.passwordRequiresUppercase"),
        }),
      confirmPassword: z
        .string()
        .min(1, { message: t("auth.errors.required") }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.errors.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

/**
 * Generic email validation schema
 * Can be reused in other forms
 */
export function createEmailSchema(t) {
  return z
    .string()
    .min(1, { message: t("auth.errors.required") })
    .email({ message: t("auth.errors.emailInvalid") })
    .refine((val) => !hasCyrillic(val), {
      message: t("auth.errors.noCyrillic"),
    });
}

/**
 * Generic password validation schema with complexity requirements
 * @param {Function} t - Translation function
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum password length
 * @param {boolean} options.requireDigit - Require at least one digit
 * @param {boolean} options.requireLowercase - Require at least one lowercase letter
 * @param {boolean} options.requireUppercase - Require at least one uppercase letter
 */
export function createPasswordSchema(t, options = {}) {
  const {
    minLength = 1,
    requireDigit = true,
    requireLowercase = true,
    requireUppercase = true,
  } = options;

  let schema = z
    .string()
    .min(minLength, {
      message:
        minLength > 1
          ? t("auth.errors.passwordTooShort", { min: minLength })
          : t("auth.errors.required"),
    })
    .refine((val) => !hasCyrillic(val), {
      message: t("auth.errors.noCyrillic"),
    });

  if (requireDigit) {
    schema = schema.refine((val) => /[0-9]/.test(val), {
      message: t("auth.errors.passwordRequiresDigit"),
    });
  }

  if (requireLowercase) {
    schema = schema.refine((val) => /[a-z]/.test(val), {
      message: t("auth.errors.passwordRequiresLowercase"),
    });
  }

  if (requireUppercase) {
    schema = schema.refine((val) => /[A-Z]/.test(val), {
      message: t("auth.errors.passwordRequiresUppercase"),
    });
  }

  return schema;
}
