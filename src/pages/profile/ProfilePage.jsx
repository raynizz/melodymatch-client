import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { PiUserCircleBold } from "react-icons/pi";
import Layout from "../../layout/layout/Layout";
import Button from "../../components/ui/Button";
import ImageCropperModal from "../../components/ui/ImageCropperModal";
import {
  FormField,
  TextareaField,
  GenderSelect,
  PreferredGendersSelect,
  LocationField,
  InterestsSelect,
} from "../../components/forms";
import { useAuth } from "../../contexts/AuthContext";
import {
  getIdentityUserById,
  updateIdentityUser,
} from "../../api/identityUserService";
import {
  getMelodyMatchUserByIdentityUserId,
  upsertMelodyMatchUser,
} from "../../api/melodyMatchUserService";
import {
  getUserProfileByMelodyMatchUserId,
  upsertUserProfile,
} from "../../api/userProfileService";
import {
  uploadAvatar,
  uploadProfilePhoto,
  deleteProfilePhoto,
} from "../../api/fileService";
import { extractApiError } from "../../utils/apiError";
import { createProfileEditorSchema } from "../../utils/validationSchemas";
import { resolveAssetUrl } from "../../utils/url";
import { IdentityUserDto } from "../../dto/identity/IdentityUserDto";
import { MelodyMatchUserDto } from "../../dto/melodyMatchUser/MelodyMatchUserDto";
import { UserProfileDto } from "../../dto/userProfile/UserProfileDto";
import { GENDER_OPTIONS, Gender } from "../../types/gender";
import { INTEREST_OPTIONS } from "../../types/interests";
import { Roles } from "../../types/roles";
import "./ProfilePage.css";

const defaultFormValues = {
  identity: {
    userName: "",
    name: "",
    surname: "",
    email: "",
    phoneNumber: "",
    isActive: true,
    lockoutEnabled: true,
  },
  melody: {
    id: null,
    gender: Gender.NotSpecified,
    avatarUrl: "",
  },
  profile: {
    id: null,
    age: "",
    bio: "",
    location: "",
    preferredGenders: [],
    preferredMinAge: "",
    preferredMaxAge: "",
    profilePhotoUrls: [],
    interests: [],
  },
};

function normalizeProfilePhoto(photo) {
  if (!photo) {
    return null;
  }
  if (typeof photo === "string") {
    return { id: null, url: photo };
  }
  return {
    id: photo.id ?? null,
    url: photo.url ?? photo.result ?? "",
  };
}

function buildFormValues(identity, melody, profile) {
  const normalizedPhotoUrls = (profile.profilePhotos ?? [])
    .map((photo) => photo.url)
    .filter(Boolean);

  return {
    identity: {
      userName: identity.userName ?? "",
      name: identity.name ?? "",
      surname: identity.surname ?? "",
      email: identity.email ?? "",
      phoneNumber: identity.phoneNumber ?? "",
      isActive: identity.isActive ?? true,
      lockoutEnabled: identity.lockoutEnabled ?? true,
    },
    melody: {
      id: melody.id ?? null,
      gender: melody.gender ?? Gender.NotSpecified,
      avatarUrl: melody.avatarUrl ?? "",
    },
    profile: {
      id: profile.id ?? null,
      age: profile.age ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      preferredGenders: profile.preferredGenders ?? [],
      preferredMinAge: profile.preferredMinAge ?? "",
      preferredMaxAge: profile.preferredMaxAge ?? "",
      profilePhotoUrls:
        normalizedPhotoUrls.length > 0
          ? normalizedPhotoUrls
          : profile.profilePhotoUrls ?? [],
      interests: profile.interests ?? [],
    },
  };
}

function parseNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const schema = useMemo(() => createProfileEditorSchema(t), [t]);
  const {
    identityUserId,
    isAuthenticated,
    refreshCurrentMelodyUser,
    user,
    hasRole,
  } = useAuth();
  const isDater = hasRole?.(Roles.Dater);
  const isAdmin = hasRole?.(Roles.Admin);
  const [identityUser, setIdentityUser] = useState(IdentityUserDto.empty());
  const [melodyMatchUser, setMelodyMatchUser] = useState(
    MelodyMatchUserDto.empty()
  );
  const [userProfile, setUserProfile] = useState(UserProfileDto.empty());
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState(null);
  const [identityReadOnly, setIdentityReadOnly] = useState(false);
  const [avatarCropPreview, setAvatarCropPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: defaultFormValues,
  });

  const preferredGenders = watch("profile.preferredGenders") ?? [];
  const selectedInterests = watch("profile.interests") ?? [];
  const avatarUrl = watch("melody.avatarUrl");
  const melodyGender = watch("melody.gender");
  const resolvedAvatarUrl = resolveAssetUrl(avatarUrl);
  const avatarDisplay = avatarCropPreview || resolvedAvatarUrl;
  const identityFallback = useMemo(
    () =>
      new IdentityUserDto({
        userName:
          user?.preferred_username ??
          user?.userName ??
          user?.username ??
          user?.email ??
          "",
        name: user?.name ?? "",
        surname: user?.surname ?? "",
        email: user?.email ?? "",
        phoneNumber: "",
        isActive: true,
        lockoutEnabled: true,
      }),
    [user]
  );
  const genderOptions = useMemo(
    () =>
      GENDER_OPTIONS.map((option) => ({
        value: String(option.value),
        label: t(option.labelKey),
      })),
    [t]
  );
  const interestOptions = useMemo(
    () =>
      INTEREST_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t]
  );

  useEffect(() => {
    register("profile.preferredGenders");
    register("profile.profilePhotoUrls");
    register("profile.interests");
    register("melody.gender");
    register("melody.avatarUrl");
  }, [register]);

  useEffect(() => {
    if (!avatarCropFile) {
      setAvatarCropPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(avatarCropFile);
    setAvatarCropPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarCropFile]);

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const input = event.target;
    setAvatarCropFile(file);
    if (input) {
      input.value = "";
    }
  };

  const handleAvatarCropCancel = () => {
    setAvatarCropFile(null);
  };

  const handleAvatarCropConfirm = async (croppedBlob) => {
    setAvatarUploading(true);
    setStatus({ type: "idle", message: "" });
    try {
      const fileName = avatarCropFile?.name ?? "avatar.png";
      const mimeType =
        croppedBlob.type || avatarCropFile?.type || "image/png";
      const processedFile = new File([croppedBlob], fileName, {
        type: mimeType,
      });
      const url = await uploadAvatar(processedFile);
      
      setValue("melody.avatarUrl", url, {
        shouldDirty: true,
        shouldTouch: true,
      });
      
      setAvatarCropFile(null);
    } catch (error) {
      const apiMessage =
        extractApiError(error) ?? t("profile.state.avatarError");
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const input = event.target;

    if (profilePhotos.length >= 3) {
      setStatus({
        type: "error",
        message: t("profile.userProfile.photoLimit"),
      });
      if (input) {
        input.value = "";
      }
      return;
    }

    if (!userProfile?.id) {
      setStatus({
        type: "error",
        message: t("profile.userProfile.photoUploadDisabled"),
      });
      if (input) {
        input.value = "";
      }
      return;
    }

    setPhotoUploading(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await uploadProfilePhoto(file, userProfile.id);
      const normalized = normalizeProfilePhoto(response);
      if (!normalized?.url) {
        throw new Error("Missing photo URL");
      }
      const nextPhotos = [...profilePhotos, normalized].slice(0, 3);
      setProfilePhotos(nextPhotos);
      setValue(
        "profile.profilePhotoUrls",
        nextPhotos.map((photo) => photo.url),
        {
          shouldDirty: true,
          shouldTouch: true,
        }
      );
    } catch (error) {
      const apiMessage =
        extractApiError(error) ?? t("profile.state.photoError");
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setPhotoUploading(false);
      if (input) {
        input.value = "";
      }
    }
  };

  const removeProfilePhoto = async (photo) => {
    try {
      if (photo.id) {
        await deleteProfilePhoto(photo.id);
      }
      const next = profilePhotos.filter((item) => item !== photo);
      setProfilePhotos(next);
      setValue(
        "profile.profilePhotoUrls",
        next.map((item) => item.url),
        {
          shouldDirty: true,
          shouldTouch: true,
        }
      );
    } catch (error) {
      const apiMessage =
        extractApiError(error) ?? t("profile.userProfile.photoDeleteError");
      setStatus({ type: "error", message: apiMessage });
    }
  };

  const loadProfile = useCallback(async () => {
    if (!identityUserId) return;
    setIsFetching(true);
    setStatus({ type: "idle", message: "" });
    setIdentityReadOnly(false);

    try {
      let identity = identityFallback;
      try {
        identity = await getIdentityUserById(identityUserId);
      } catch (error) {
        if (error?.response?.status === 403) {
          setIdentityReadOnly(true);
          identity = identityFallback;
        } else {
          throw error;
        }
      }

      let melodyResponse = MelodyMatchUserDto.empty();
      if (isDater) {
        melodyResponse = await getMelodyMatchUserByIdentityUserId(
          identityUserId
        ).catch((error) => {
          if (error?.response?.status === 404) {
            return MelodyMatchUserDto.empty();
          }
          throw error;
        });
      }

      let profileResponse = UserProfileDto.empty();
      if (melodyResponse?.id && isDater) {
        profileResponse = await getUserProfileByMelodyMatchUserId(
          melodyResponse.id
        ).catch((error) => {
          if (error?.response?.status === 404) {
            return UserProfileDto.empty();
          }
          throw error;
        });
      }

      setIdentityUser(identity);
      setMelodyMatchUser(melodyResponse);
      setUserProfile(profileResponse);
      setProfilePhotos(profileResponse.profilePhotos ?? []);
      reset(buildFormValues(identity, melodyResponse, profileResponse));
    } catch (error) {
      const apiMessage =
        extractApiError(error) ?? t("profile.state.loadError");
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setIsFetching(false);
    }
  }, [identityFallback, identityUserId, isDater, reset, t]);

  useEffect(() => {
    if (identityUserId) {
      loadProfile();
    } else {
      setIsFetching(false);
    }
  }, [identityUserId, loadProfile]);

  const onSubmit = async (formData) => {
    if (!identityUserId) return;
    setIsSaving(true);
    setStatus({ type: "idle", message: "" });

    try {
      let identityMessage = null;
      let updatedIdentity = identityUser;

      if (!identityReadOnly) {
        try {
          updatedIdentity = await updateIdentityUser(identityUserId, {
            userName: formData.identity.userName,
            name: formData.identity.name,
            surname: formData.identity.surname,
            email: formData.identity.email,
            phoneNumber: formData.identity.phoneNumber,
            isActive: true,
            lockoutEnabled: true,
          });
        } catch (error) {
          if (error?.response?.status === 403) {
            setIdentityReadOnly(true);
            identityMessage = t("profile.identity.partialError");
          } else {
            throw error;
          }
        }
      }

      if (isDater) {
        const updatedMelody = await upsertMelodyMatchUser({
          id: melodyMatchUser?.id ?? undefined,
          identityUserId,
          gender: Number(formData.melody.gender),
          avatarUrl: formData.melody.avatarUrl,
        });

        const parsedProfile = await upsertUserProfile({
          id: userProfile?.id ?? undefined,
          melodyMatchUserId: updatedMelody.id,
          age: parseNumber(formData.profile.age),
          bio: formData.profile.bio,
          location: formData.profile.location,
          preferredGenders: formData.profile.preferredGenders ?? [],
          preferredMinAge: parseNumber(formData.profile.preferredMinAge),
          preferredMaxAge: parseNumber(formData.profile.preferredMaxAge),
          profilePhotoUrls: formData.profile.profilePhotoUrls ?? [],
          interests: (formData.profile.interests ?? [])
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value)),
        });

        setMelodyMatchUser(updatedMelody);
        setUserProfile(parsedProfile);
        setProfilePhotos(parsedProfile.profilePhotos ?? []);
        reset(buildFormValues(updatedIdentity, updatedMelody, parsedProfile));
      } else {
        reset(buildFormValues(updatedIdentity, melodyMatchUser, userProfile));
      }

      setIdentityUser(updatedIdentity);

      await refreshCurrentMelodyUser();

      if (identityMessage) {
        setStatus({ type: "error", message: identityMessage });
      } else {
        setStatus({ type: "success", message: t("profile.state.success") });
      }
    } catch (error) {
      const apiMessage =
        extractApiError(error) ?? t("profile.state.error");
      setStatus({ type: "error", message: apiMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isDater && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <section className="profile-page">
        <header className="profile-page__header">
          <p className="profile-page__eyebrow">{t("profile.eyebrow")}</p>
          <h1>{t("profile.title")}</h1>
          <p className="profile-page__subtitle">{t("profile.subtitle")}</p>
        </header>

        {status.message && (
          <div
            className={`profile-status profile-status--${status.type}`}
            role={status.type === "error" ? "alert" : "status"}
          >
            {status.message}
          </div>
        )}

        {isFetching ? (
          <div className="profile-card profile-card--loading">
            {t("profile.state.loading")}
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
            <section className="profile-card">
              <header>
                <h2>{t("profile.identity.title")}</h2>
                <p>{t("profile.identity.description")}</p>
              </header>
              {identityReadOnly && (
                <p className="profile-identity__notice">
                  {t("profile.identity.readonlyNotice")}
                </p>
              )}

              <div className="profile-grid">
                <FormField
                  id="identity-userName"
                  label={t("profile.identity.fields.userName")}
                  placeholder="melody.match"
                  error={errors.identity?.userName?.message}
                  required
                  disabled={identityReadOnly}
                  {...register("identity.userName")}
                />

                <FormField
                  id="identity-email"
                  label={t("profile.identity.fields.email")}
                  type="email"
                  placeholder="user@example.com"
                  error={errors.identity?.email?.message}
                  required
                  disabled={identityReadOnly}
                  {...register("identity.email")}
                />

                <FormField
                  id="identity-name"
                  label={t("profile.identity.fields.name")}
                  placeholder={t("profile.identity.fields.namePlaceholder")}
                  error={errors.identity?.name?.message}
                  disabled={identityReadOnly}
                  {...register("identity.name")}
                />

                <FormField
                  id="identity-surname"
                  label={t("profile.identity.fields.surname")}
                  placeholder={t("profile.identity.fields.surnamePlaceholder")}
                  error={errors.identity?.surname?.message}
                  disabled={identityReadOnly}
                  {...register("identity.surname")}
                />

                <FormField
                  id="identity-phone"
                  label={t("profile.identity.fields.phoneNumber")}
                  placeholder="+380..."
                  error={errors.identity?.phoneNumber?.message}
                  disabled={identityReadOnly}
                  {...register("identity.phoneNumber")}
                />
              </div>
            </section>

            {isDater && (
              <>
                <section className="profile-card">
                  <header>
                    <h2>{t("profile.melody.title")}</h2>
                    <p>{t("profile.melody.description")}</p>
                  </header>

                  <GenderSelect
                    id="melody-gender"
                    label={t("profile.melody.genderLabel")}
                    options={genderOptions}
                    value={melodyGender}
                    onChange={(selectedValue) =>
                      setValue("melody.gender", selectedValue, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                    }
                    error={errors.melody?.gender?.message}
                  />

                  <input type="hidden" {...register("melody.avatarUrl")} />

                  <div className="profile-avatar-upload">
                    <div className="profile-avatar-upload__preview">
                      {avatarDisplay ? (
                        <img
                          src={avatarDisplay}
                          alt={t("profile.melody.avatarPreviewAlt")}
                        />
                      ) : (
                        <PiUserCircleBold aria-hidden />
                      )}
                    </div>
                    <div className="profile-avatar-upload__body">
                      <p>{t("profile.melody.avatarHelper")}</p>
                      <label className="upload-button">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={avatarUploading}
                        />
                        {avatarUploading
                          ? t("profile.melody.uploadLoading")
                          : t("profile.melody.uploadCta")}
                      </label>
                      {errors.melody?.avatarUrl?.message && (
                        <p className="form-error" role="alert">
                          {errors.melody.avatarUrl.message}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="profile-card">
                  <header>
                    <h2>{t("profile.userProfile.title")}</h2>
                    <p>{t("profile.userProfile.description")}</p>
                  </header>

                  <div className="profile-grid">
                    <FormField
                      id="profile-age"
                      label={t("profile.userProfile.fields.age")}
                      type="number"
                      min="18"
                      error={errors.profile?.age?.message}
                      {...register("profile.age")}
                    />

                    <LocationField
                      id="profile-location"
                      label={t("profile.userProfile.fields.location")}
                      placeholder={t("profile.userProfile.fields.locationPlaceholder")}
                      error={errors.profile?.location?.message}
                      detectDisabled={isSaving || isFetching}
                      onDetected={(cityName) => {
                        setValue("profile.location", cityName, {
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                      {...register("profile.location")}
                    />

                    <FormField
                      id="profile-preferredMinAge"
                      label={t("profile.userProfile.fields.preferredMinAge")}
                      type="number"
                      min="18"
                      error={errors.profile?.preferredMinAge?.message}
                      {...register("profile.preferredMinAge")}
                    />

                    <FormField
                      id="profile-preferredMaxAge"
                      label={t("profile.userProfile.fields.preferredMaxAge")}
                      type="number"
                      min="18"
                      error={errors.profile?.preferredMaxAge?.message}
                      {...register("profile.preferredMaxAge")}
                    />
                  </div>

                  <TextareaField
                    id="profile-bio"
                    label={t("profile.userProfile.fields.bio")}
                    rows={4}
                    placeholder={t("profile.userProfile.fields.bioPlaceholder")}
                    error={errors.profile?.bio?.message}
                    {...register("profile.bio")}
                  />

                  <PreferredGendersSelect
                    id="preferred-genders"
                    label={t("profile.userProfile.fields.preferredGenders")}
                    options={genderOptions}
                    value={preferredGenders}
                    onChange={(selectedValues) => {
                      setValue("profile.preferredGenders", selectedValues, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                    error={errors.profile?.preferredGenders?.message}
                  />

                  <InterestsSelect
                    id="profile-interests"
                    label={t("profile.userProfile.fields.interests")}
                    helper={t("profile.userProfile.fields.interestsHelper")}
                    options={interestOptions}
                    value={selectedInterests}
                    onChange={(selectedValues) => {
                      setValue("profile.interests", selectedValues, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                    disabled={isSaving || isFetching}
                    error={errors.profile?.interests?.message}
                  />

                  <div className="profile-photo-manager">
                    <div className="profile-photo-manager__header">
                      <div>
                        <p className="profile-photo-manager__title">
                          {t("profile.userProfile.fields.profilePhotoUrls")}
                        </p>
                        {!userProfile?.id && (
                          <p className="profile-photo-manager__hint">
                            {t("profile.userProfile.photoUploadDisabled")}
                          </p>
                        )}
                      </div>
                      <label className="upload-button">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          disabled={
                            photoUploading ||
                            !userProfile?.id ||
                            profilePhotos.length >= 3
                          }
                        />
                        {photoUploading
                          ? t("profile.userProfile.photoUploadLoading")
                          : t("profile.userProfile.photoUploadCta")}
                      </label>
                    </div>

                    {profilePhotos.length === 0 ? (
                      <p className="profile-photo-manager__empty">
                        {t("profile.userProfile.photosEmpty")}
                      </p>
                    ) : (
                      <div className="profile-photo-grid">
                        {profilePhotos.map((photo) => (
                          <figure
                            key={photo.id ?? photo.url}
                            className="profile-photo-card"
                          >
                            <img src={resolveAssetUrl(photo.url)} alt="" />
                            <button
                              type="button"
                              className="profile-photo-card__remove"
                              onClick={() => removeProfilePhoto(photo)}
                              aria-label={t("profile.userProfile.removePhoto")}
                            >
                              ×
                            </button>
                          </figure>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            <div className="profile-actions">
              <Button
                type="submit"
                size="lg"
                disabled={isSaving || isFetching || !isDirty}
              >
                {isSaving ? t("profile.actions.saving") : t("profile.actions.save")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSaving || isFetching}
                onClick={() => {
                  reset(buildFormValues(identityUser, melodyMatchUser, userProfile));
                  setProfilePhotos(userProfile.profilePhotos ?? []);
                }}
              >
                {t("profile.actions.reset")}
              </Button>
            </div>
          </form>
        )}
      </section>
      <ImageCropperModal
        file={avatarCropFile}
        open={Boolean(avatarCropFile)}
        onCancel={handleAvatarCropCancel}
        onConfirm={handleAvatarCropConfirm}
        title={t("profile.melody.crop.title")}
        instructions={t("profile.melody.crop.instructions")}
        confirmLabel={t("profile.melody.crop.confirm")}
        cancelLabel={t("profile.melody.crop.cancel")}
        zoomLabel={t("profile.melody.crop.zoom")}
      />
    </Layout>
  );
}
