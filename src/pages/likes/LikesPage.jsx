import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../../layout/layout/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { Roles } from "../../types/roles";
import MatchCard from "../../components/match/MatchCard";
import ReactionBar from "../../components/match/ReactionBar";
import ActionModal from "../../components/match/ActionModal";
import { fetchLikedForCurrentProfileUsers } from "../../api/recommendationService";
import { submitComplaint } from "../../api/complaintService";
import { submitReaction } from "../../api/reactionService";
import { ComplaintStatus, ReactionType } from "../../types/match";
import { useSuggestionQueue } from "../../hooks/useSuggestionQueue";
import "../match/MatchPage.css";

const EXIT_ANIMATION_MS = 240;

export default function LikesPage() {
  const { t } = useTranslation();
  const { isAuthenticated, currentMelodyUser, isMelodyUserLoading, hasRole } =
    useAuth();
  const fetcher = useCallback(
    () => fetchLikedForCurrentProfileUsers({ take: 10 }),
    []
  );
  const {
    queue,
    currentProfile,
    isFetching,
    hasNoMore,
    statusMessage: queueStatus,
    fetchMore,
    advance,
    setStatusMessage: setQueueStatus,
  } = useSuggestionQueue({
    fetcher,
  });
  const [photoIndex, setPhotoIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [isReacting, setIsReacting] = useState(false);
  const [animationDirection, setAnimationDirection] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const queueLength = queue.length;

  const resetForNextProfile = useCallback(() => {
    advance();
    setPhotoIndex(0);
    setAnimationDirection(null);
    setReportModalOpen(false);
    setReportText("");
  }, [advance]);

  useEffect(() => {
    setPhotoIndex(0);
    setAnimationDirection(null);
  }, [currentProfile?.melodyMatchUserId]);

  const performReaction = useCallback(
    async ({ type, direction = null, beforeSend }) => {
      if (!currentProfile) {
        return;
      }

      if (!currentMelodyUser?.id) {
        setStatusMessage(t("likes.errors.noProfile"));
        return;
      }

      if (!currentProfile?.melodyMatchUserId) {
        setStatusMessage(t("likes.errors.reaction"));
        return;
      }

      if (isReacting) return;
      setIsReacting(true);
      setStatusMessage("");
      setQueueStatus("");
      if (direction) {
        setAnimationDirection(direction);
      }

      try {
        if (beforeSend) {
          await beforeSend();
        }

        await submitReaction({
          fromUserId: currentMelodyUser.id,
          toUserId: currentProfile.melodyMatchUserId,
          type,
        });

        if (direction) {
          await new Promise((resolve) =>
            setTimeout(resolve, EXIT_ANIMATION_MS)
          );
        }

        resetForNextProfile();
      } catch (error) {
        console.error("Reaction failed", error);
        setStatusMessage(t("likes.errors.reaction"));
        setQueueStatus("");
        setAnimationDirection(null);
      } finally {
        setIsReacting(false);
      }
    },
    [
      currentMelodyUser,
      currentProfile,
      isReacting,
      resetForNextProfile,
      setQueueStatus,
      t,
    ]
  );

  const handleSkip = () =>
    performReaction({ type: ReactionType.Skip, direction: "left" });

  const handleLike = () =>
    performReaction({ type: ReactionType.Like, direction: "right" });

  const handleReport = () => {
    if (!currentProfile) return;
    setReportText("");
    setReportModalOpen(true);
  };

  const submitReportReaction = () =>
    performReaction({
      type: ReactionType.Report,
      beforeSend: () =>
        submitComplaint({
          reporterId: currentMelodyUser?.id,
          reportedUserId: currentProfile?.melodyMatchUserId,
          reason: reportText.trim(),
          status: ComplaintStatus.Sent,
        }),
    });

  const emptyStateMessage = useMemo(() => {
    if (isMelodyUserLoading || isFetching) {
      return t("likes.states.loading");
    }
    if (hasNoMore && queueLength === 0) {
      return t("likes.states.empty");
    }
    return t("likes.states.idle");
  }, [hasNoMore, isFetching, isMelodyUserLoading, queueLength, t]);

  const mergedStatus =
    statusMessage ||
    (queueStatus === "load-error" ? t("likes.errors.load") : queueStatus);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole?.(Roles.Dater)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="match-page">
        <header className="match-page__header">
          <div>
            <p className="eyebrow">{t("likes.eyebrow")}</p>
            <h1>{t("likes.title")}</h1>
            <p className="helper">{t("likes.subtitle")}</p>
          </div>
        </header>

        {mergedStatus && (
          <div className="match-page__status">{mergedStatus}</div>
        )}

        {currentProfile ? (
          <div className="match-page__deck">
            <MatchCard
              profile={currentProfile}
              photoIndex={photoIndex}
              onPrevPhoto={() =>
                setPhotoIndex((prev) =>
                  prev === 0 ? prev : Math.max(prev - 1, 0)
                )
              }
              onNextPhoto={() =>
                setPhotoIndex((prev) =>
                  prev + 1 >= (currentProfile.photosUrls?.length ?? 0)
                    ? prev
                    : prev + 1
                )
              }
              onSwipeLeft={handleSkip}
              onSwipeRight={handleLike}
              animationDirection={animationDirection}
              disableGestures={isReacting || reportModalOpen}
              noPhotosLabel={t("match.labels.noPhotos")}
              enableSwipeUp={false}
              inlineMessage={currentProfile.message}
            />

            <div className="match-page__actions">
              <ReactionBar
                onSkip={handleSkip}
                onReport={handleReport}
                onLike={handleLike}
                disabled={isReacting || reportModalOpen}
                skipLabel={t("match.actions.skip")}
                reportLabel={t("match.actions.report")}
                likeLabel={t("match.actions.like")}
                showMessageButton={false}
              />
            </div>

            {isFetching && (
              <p className="match-page__hint">{t("likes.states.loading")}</p>
            )}
          </div>
        ) : (
          <div className="match-page__empty">
            <p>{emptyStateMessage}</p>
            {!hasNoMore && (
              <button
                type="button"
                className="refresh-link"
                onClick={fetchMore}
                disabled={isFetching}
              >
                {t("likes.actions.refresh")}
              </button>
            )}
          </div>
        )}
      </div>

      <ActionModal
        open={reportModalOpen}
        title={t("match.modals.report.title")}
        description={t("match.modals.report.description")}
        value={reportText}
        placeholder={t("match.modals.report.placeholder")}
        onChange={setReportText}
        onClose={() => setReportModalOpen(false)}
        onSubmit={submitReportReaction}
        submitLabel={t("match.modals.report.submit")}
        cancelLabel={t("match.modals.cancel")}
        busy={isReacting}
      />
    </Layout>
  );
}
