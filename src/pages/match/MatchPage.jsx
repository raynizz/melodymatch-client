import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../../layout/layout/Layout";
import { useAuth } from "../../contexts/AuthContext";
import MatchCard from "../../components/match/MatchCard";
import ReactionBar from "../../components/match/ReactionBar";
import ActionModal from "../../components/match/ActionModal";
import { fetchSuggestionsForCurrentUser } from "../../api/recommendationService";
import { submitComplaint } from "../../api/complaintService";
import { submitReaction } from "../../api/reactionService";
import { ComplaintStatus, ReactionType } from "../../types/match";
import { useSuggestionQueue } from "../../hooks/useSuggestionQueue";
import "./MatchPage.css";

const EXIT_ANIMATION_MS = 240;

export default function MatchPage() {
  const { t } = useTranslation();
  const { isAuthenticated, currentMelodyUser, isMelodyUserLoading } = useAuth();
  const fetcher = useCallback(
    () => fetchSuggestionsForCurrentUser({ take: 10 }),
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
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [reportText, setReportText] = useState("");
  const queueLength = queue.length;

  const resetForNextProfile = useCallback(() => {
    advance();
    setPhotoIndex(0);
    setAnimationDirection(null);
    setMessageModalOpen(false);
    setReportModalOpen(false);
    setMessageText("");
    setReportText("");
  }, [advance]);

  useEffect(() => {
    setPhotoIndex(0);
    setAnimationDirection(null);
  }, [currentProfile?.melodyMatchUserId]);

  const performReaction = useCallback(
    async ({ type, message = "", direction = null, beforeSend }) => {
      if (!currentProfile) {
        return;
      }

      if (!currentMelodyUser?.id) {
        setStatusMessage(t("match.errors.noProfile"));
        return;
      }

      if (!currentProfile?.melodyMatchUserId) {
        setStatusMessage(t("match.errors.reaction"));
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
          message,
        });

        if (direction) {
          await new Promise((resolve) =>
            setTimeout(resolve, EXIT_ANIMATION_MS)
          );
        }

        resetForNextProfile();
      } catch (error) {
        console.error("Reaction failed", error);
        setStatusMessage(t("match.errors.reaction"));
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
      t,
      setQueueStatus,
    ]
  );

  const handleSkip = () =>
    performReaction({ type: ReactionType.Skip, direction: "left" });

  const handleLike = () =>
    performReaction({ type: ReactionType.Like, direction: "right" });

  const handleLikeWithMessage = () => {
    if (!currentProfile) return;
    setMessageText("");
    setMessageModalOpen(true);
  };

  const handleReport = () => {
    if (!currentProfile) return;
    setReportText("");
    setReportModalOpen(true);
  };

  const submitMessageReaction = () =>
    performReaction({
      type: ReactionType.LikeWithMessage,
      message: messageText.trim(),
      direction: "up",
    });

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
      return t("match.states.loading");
    }
    if (hasNoMore && queueLength === 0) {
      return t("match.states.empty");
    }
    return t("match.states.idle");
  }, [hasNoMore, isFetching, isMelodyUserLoading, queueLength, t]);

  const mergedStatus =
    statusMessage ||
    (queueStatus === "load-error" ? t("match.errors.load") : queueStatus);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="match-page">
        <header className="match-page__header">
          <div>
            <p className="eyebrow">{t("match.eyebrow")}</p>
            <h1>{t("match.title")}</h1>
            <p className="helper">{t("match.subtitle")}</p>
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
              onSwipeUp={handleLikeWithMessage}
              animationDirection={animationDirection}
              disableGestures={isReacting || messageModalOpen || reportModalOpen}
              noPhotosLabel={t("match.labels.noPhotos")}
            />

            <div className="match-page__actions">
              <ReactionBar
                onSkip={handleSkip}
                onMessage={handleLikeWithMessage}
                onReport={handleReport}
                onLike={handleLike}
                disabled={isReacting || messageModalOpen || reportModalOpen}
                skipLabel={t("match.actions.skip")}
                messageLabel={t("match.actions.message")}
                reportLabel={t("match.actions.report")}
                likeLabel={t("match.actions.like")}
              />
            </div>

            {isFetching && (
              <p className="match-page__hint">{t("match.states.loading")}</p>
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
                {t("match.actions.refresh")}
              </button>
            )}
          </div>
        )}
      </div>

      <ActionModal
        open={messageModalOpen}
        title={t("match.modals.message.title")}
        description={t("match.modals.message.description")}
        value={messageText}
        placeholder={t("match.modals.message.placeholder")}
        onChange={setMessageText}
        onClose={() => setMessageModalOpen(false)}
        onSubmit={submitMessageReaction}
        submitLabel={t("match.modals.message.submit")}
        cancelLabel={t("match.modals.cancel")}
        busy={isReacting}
      />

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
