import { forwardRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./LocationField.css";

const buildReverseGeocodeUrl = (latitude, longitude) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: latitude.toString(),
    lon: longitude.toString(),
    zoom: "10",
    addressdetails: "1",
    "accept-language": "en",
  });

  return `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
};

async function lookupCity(coords) {
  const response = await fetch(
    buildReverseGeocodeUrl(coords.latitude, coords.longitude),
    {
      headers: {
        "Accept-Language": "en",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Reverse geocode failed");
  }

  const data = await response.json();
  const address = data?.address ?? {};
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.state ||
    address.county ||
    ""
  ).trim();
}

const IP_LOOKUP_URL = "https://ipapi.co/json/";

async function lookupCityByIp() {
  const response = await fetch(IP_LOOKUP_URL, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("IP lookup failed");
  }
  const data = await response.json();
  return (data?.city ?? "").trim();
}

const LocationField = forwardRef(
  (
    {
      label,
      error,
      id,
      placeholder,
      required = false,
      onDetected,
      detectDisabled = false,
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const [isDetecting, setIsDetecting] = useState(false);
    const inputDisabled = rest?.disabled;

    const triggerDetected = (cityName) => {
      if (!cityName) {
        throw new Error("Missing city name");
      }
      onDetected?.(cityName);
      if (!onDetected && typeof rest?.onChange === "function") {
        rest.onChange({
          target: {
            name: rest.name,
            value: cityName,
          },
        });
      }
    };

    const fallbackToIpLookup = async () => {
      setStatus({
        type: "info",
        message: t("profile.userProfile.locationField.ipFallback"),
      });
      try {
        const cityName = await lookupCityByIp();
        if (!cityName) {
          throw new Error("IP city missing");
        }
        triggerDetected(cityName);
        setStatus({
          type: "success",
          message: t("profile.userProfile.locationField.detected", {
            city: cityName,
          }),
        });
      } catch {
        setStatus({
          type: "error",
          message: t("profile.userProfile.locationField.ipFallbackFailed"),
        });
      } finally {
        setIsDetecting(false);
      }
    };

    const handleDetect = () => {
      if (isDetecting || detectDisabled || inputDisabled) {
        return;
      }

      if (!navigator?.geolocation) {
        setStatus({
          type: "error",
          message: t("profile.userProfile.locationField.geoUnavailable"),
        });
        return;
      }

      setIsDetecting(true);
      setStatus({
        type: "info",
        message: t("profile.userProfile.locationField.detecting"),
      });

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const cityName = await lookupCity(position.coords);
            if (!cityName) {
              throw new Error("City not found");
            }
            triggerDetected(cityName);
            setStatus({
              type: "success",
              message: t("profile.userProfile.locationField.detected", {
                city: cityName,
              }),
            });
          } catch {
            setStatus({
              type: "error",
              message: t("profile.userProfile.locationField.lookupFailed"),
            });
          } finally {
            setIsDetecting(false);
          }
        },
        (geoError) => {
          if (geoError.code === 1) {
            setIsDetecting(false);
            setStatus({
              type: "error",
              message: t(
                "profile.userProfile.locationField.permissionDenied"
              ),
            });
          } else if (geoError.code === 2) {
            fallbackToIpLookup();
          } else if (geoError.code === 3) {
            fallbackToIpLookup();
          } else {
            setIsDetecting(false);
            setStatus({
              type: "error",
              message: t("profile.userProfile.locationField.lookupFailed"),
            });
          }
        }
      );
    };

    const statusRole =
      status.type === "error" ? "alert" : status.message ? "status" : undefined;

    return (
      <div className={`form-field location-field ${error ? "form-field--error" : ""}`}>
        <div className="location-field__label-row">
          <label htmlFor={id}>
            {label}
            {required && <span className="form-field__required"> *</span>}
          </label>
          <button
            type="button"
            className="location-field__detect"
            onClick={handleDetect}
            disabled={isDetecting || detectDisabled || inputDisabled}
          >
            {isDetecting
              ? t("profile.userProfile.locationField.detecting")
              : t("profile.userProfile.locationField.detectCta")}
          </button>
        </div>
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${id}-error`
              : status.message
              ? `${id}-status`
              : undefined
          }
          {...rest}
        />
        {status.message && (
          <p
            id={`${id}-status`}
            className={`location-field__status location-field__status--${status.type}`}
            role={statusRole}
          >
            {status.message}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

LocationField.displayName = "LocationField";

export default LocationField;
