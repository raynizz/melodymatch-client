import { useEffect, useMemo, useRef, useState } from "react";
import {
  PiMapPinLineDuotone,
  PiMusicNotesSimpleDuotone,
  PiUserDuotone,
} from "react-icons/pi";
import { resolveAssetUrl } from "../../utils/url";
import "./MatchCard.css";

const DRAG_THRESHOLD = 80;
const EXIT_ANIMATION_MS = 240;

const exitTransforms = {
  left: "translate(-140%, -6%) rotate(-12deg)",
  right: "translate(140%, -6%) rotate(12deg)",
  up: "translateY(-130%) scale(0.95)",
};

function InterestChips({ interests }) {
  if (!interests?.length) return null;

  return (
    <div className="match-card__chips" aria-label="Interests">
      {interests.map((item) => (
        <span key={item} className="chip">
          {item}
        </span>
      ))}
    </div>
  );
}

export default function MatchCard({
  profile,
  photoIndex,
  onPrevPhoto,
  onNextPhoto,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  animationDirection,
  disableGestures,
  noPhotosLabel = "No photos yet",
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, isDragging: false });
  const [peekUp, setPeekUp] = useState(false);
  const startRef = useRef(null);
  const photoCount = profile?.photosUrls?.length ?? 0;

  const photoUrl = useMemo(() => {
    const source =
      profile?.photosUrls?.[photoIndex] ??
      profile?.photosUrls?.[0] ??
      profile?.primaryPhoto ??
      "";
    return resolveAssetUrl(source);
  }, [photoIndex, profile]);

  useEffect(() => {
    setDrag({ x: 0, y: 0, isDragging: false });
    setPeekUp(false);
  }, [profile?.melodyMatchUserId, animationDirection]);

  const handlePointerDown = (event) => {
    if (disableGestures) return;
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      rect: event.currentTarget.getBoundingClientRect(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0, isDragging: true });
  };

  const handlePointerMove = (event) => {
    if (!startRef.current || !drag.isDragging) return;
    const x = event.clientX - startRef.current.x;
    const y = event.clientY - startRef.current.y;
    setDrag((prev) => ({
      ...prev,
      x,
      y,
    }));
  };

  const resetPointer = () => {
    startRef.current = null;
    setDrag({ x: 0, y: 0, isDragging: false });
  };

  const handlePointerEnd = (event) => {
    if (!drag.isDragging) return;
    const { x, y } = drag;
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const rect =
      startRef.current?.rect ??
      event.currentTarget.getBoundingClientRect();
    resetPointer();

    if (absX > absY && absX > DRAG_THRESHOLD) {
      if (x > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
      return;
    }

    if (-y > DRAG_THRESHOLD) {
      setPeekUp(true);
      onSwipeUp?.();
      setTimeout(() => setPeekUp(false), EXIT_ANIMATION_MS);
      return;
    }

    const clickX = event.clientX - rect.left;
    if (clickX < rect.width / 2) {
      onPrevPhoto?.();
    } else {
      onNextPhoto?.();
    }
  };

  const dragTransform = animationDirection
    ? exitTransforms[animationDirection] ?? ""
    : `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 25}deg)`;

  const classNames = [
    "match-card",
    animationDirection ? "is-exiting" : "",
    animationDirection ? `exit-${animationDirection}` : "",
    drag.isDragging ? "is-dragging" : "",
    peekUp ? "peek-up" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={classNames}
      style={{ transform: dragTransform }}
    >
      <div
        className="match-card__media"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={resetPointer}
        onPointerLeave={resetPointer}
      >
        {photoCount > 1 && (
          <div className="match-card__progress">
            {profile.photosUrls.map((_, index) => (
              <span
                key={index}
                className={index === photoIndex ? "is-active" : ""}
              />
            ))}
          </div>
        )}
        {photoUrl ? (
          <div
            className="match-card__photo"
            style={{ backgroundImage: `url(${photoUrl})` }}
          />
        ) : (
          <div className="match-card__placeholder">
            <PiUserDuotone aria-hidden />
          </div>
        )}
        <div className="match-card__shadow" aria-hidden />
      </div>

      <div className="match-card__body">
        <div className="match-card__title">
          <div>
            <h2>
              {profile?.name}
              {profile?.age ? `, ${profile.age}` : ""}
            </h2>
            {profile?.location && (
              <p className="match-card__meta">
                <PiMapPinLineDuotone aria-hidden />
                <span>{profile.location}</span>
              </p>
            )}
          </div>
          <span className="match-card__pill">{profile?.gender}</span>
        </div>

        {profile?.bio && <p className="match-card__bio">{profile.bio}</p>}

        <InterestChips interests={profile?.interests} />

        {profile?.photosUrls?.length === 0 && (
          <p className="match-card__meta">
            <PiMusicNotesSimpleDuotone aria-hidden />
            <span>{noPhotosLabel}</span>
          </p>
        )}
      </div>
    </article>
  );
}
