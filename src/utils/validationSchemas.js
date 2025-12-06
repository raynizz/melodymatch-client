import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

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

function preprocessNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

const optionalUnsignedNumber = (t, { min = 0 } = {}) =>
  z
    .preprocess(
      preprocessNumber,
      z
        .number({
          invalid_type_error: t("profile.errors.number"),
        })
        .int(t("profile.errors.number"))
        .min(min, {
          message:
            min > 0
              ? t("profile.errors.min", { min })
              : t("profile.errors.number"),
        })
    )
    .optional();

export function createProfileEditorSchema(t) {
  return z.object({
    identity: z.object({
      userName: z
        .string()
        .min(1, { message: t("profile.errors.required") })
        .max(64, { message: t("profile.errors.length", { max: 64 }) }),
      name: z
        .string()
        .max(64, { message: t("profile.errors.length", { max: 64 }) })
        .optional(),
      surname: z
        .string()
        .max(64, { message: t("profile.errors.length", { max: 64 }) })
        .optional(),
      email: z
        .string()
        .min(1, { message: t("profile.errors.required") })
        .email({ message: t("profile.errors.email") }),
      phoneNumber: z
        .string()
        .max(32, { message: t("profile.errors.length", { max: 32 }) })
        .optional()
        .refine(
          (value) =>
            !value ||
            value.trim() === "" ||
            isValidPhoneNumber(value.trim(), { defaultCountry: "UA" }),
          { message: t("profile.errors.phone") }
        ),
      isActive: z.literal(true).optional(),
      lockoutEnabled: z.literal(true).optional(),
    }),
    melody: z.object({
      gender: z
        .coerce.number({
          invalid_type_error: t("profile.errors.gender"),
        })
        .int({ message: t("profile.errors.gender") })
        .min(0, { message: t("profile.errors.gender") })
        .max(2, { message: t("profile.errors.gender") }),
      avatarUrl: z
        .string()
        .url({ message: t("profile.errors.url") })
        .or(z.literal(""))
        .optional(),
    }),
    profile: z.object({
      age: optionalUnsignedNumber(t, { min: 18 }),
      bio: z
        .string()
        .max(600, { message: t("profile.errors.bioLength") })
        .optional(),
      location: z
        .string()
        .max(120, { message: t("profile.errors.locationLength") })
        .optional(),
      preferredGenders: z.array(z.number()).optional(),
      preferredMinAge: optionalUnsignedNumber(t, { min: 18 }),
      preferredMaxAge: optionalUnsignedNumber(t, { min: 18 }),
      profilePhotoUrls: z
        .array(
          z.string().url({
            message: t("profile.errors.url"),
          })
        )
        .optional()
        .default([]),
      interests: z.array(z.number()).optional(),
    }),
  });
}
