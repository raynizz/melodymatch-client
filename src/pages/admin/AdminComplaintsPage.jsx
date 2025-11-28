import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Layout from "../../layout/layout/Layout";
import Button from "../../components/ui/Button";
import FeedbackPopup from "../../components/ui/FeedbackPopup";
import {
  banUserFromComplaint,
  fetchComplaintById,
  fetchComplaints,
  resolveComplaint,
  unbanUser,
  updateComplaintStatus,
} from "../../api/complaintService";
import { ComplaintStatus } from "../../types/match";
import { resolveAssetUrl } from "../../utils/url";
import "./AdminComplaintsPage.css";

function formatDate(value, locale) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(locale || undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusKey(status) {
  switch (status) {
    case ComplaintStatus.InReview:
    case 1:
      return "in-progress";
    case ComplaintStatus.Resolved:
      return "resolved";
    case ComplaintStatus.Dismissed:
      return "dismissed";
    case ComplaintStatus.Sent:
    default:
      return "sent";
  }
}

export default function AdminComplaintsPage() {
  const { t, i18n } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState(
    String(ComplaintStatus.Sent)
  );
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState({ type: "", message: "" });
  const [banReason, setBanReason] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const statusOptions = [
    { value: "all", label: t("adminComplaints.filters.all") },
    { value: String(ComplaintStatus.Sent), label: t("adminComplaints.status.sent") },
    { value: String(ComplaintStatus.InReview), label: t("adminComplaints.status.inProgress") },
    { value: String(ComplaintStatus.Resolved), label: t("adminComplaints.status.resolved") },
    { value: String(ComplaintStatus.Dismissed), label: t("adminComplaints.status.dismissed") },
  ];

  const selectedComplaint = useMemo(
    () =>
      complaints.find((item) => item.id === selectedComplaintId) ??
      complaints[0] ??
      null,
    [complaints, selectedComplaintId]
  );

  const isClosed =
    selectedComplaint &&
    [ComplaintStatus.Resolved, ComplaintStatus.Dismissed].includes(
      selectedComplaint.status
    );
  const profile = selectedComplaint?.reportedUserProfile;

  const loadComplaints = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const statusValue =
        statusFilter === "all" ? undefined : Number(statusFilter);
      const result = await fetchComplaints({
        status: statusValue,
      });
      setComplaints(result.items);
      if (result.items.length > 0) {
        setSelectedComplaintId((prev) =>
          prev && result.items.some((item) => item.id === prev)
            ? prev
            : result.items[0].id
        );
      } else {
        setSelectedComplaintId(null);
      }
    } catch (err) {
      console.error("Failed to load complaints", err);
      setError(t("adminComplaints.feedback.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedComplaintId) return;
      try {
        const details = await fetchComplaintById(selectedComplaintId);
        if (details) {
          setComplaints((prev) => {
            const exists = prev.some((item) => item.id === details.id);
            if (!exists) return prev;
            return prev.map((item) =>
              item.id === details.id ? details : item
            );
          });
        }
      } catch (err) {
        console.warn("Failed to load complaint details", err);
      }
    };
    loadDetails();
  }, [selectedComplaintId]);

  useEffect(() => {
    if (!selectedComplaint) {
      setBanReason("");
      setResolutionNote("");
      return;
    }

    setBanReason(selectedComplaint.reason ?? "");
    setResolutionNote(selectedComplaint.resolutionNote ?? "");
  }, [selectedComplaint]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  const handleBan = async () => {
    if (!selectedComplaint) return;
    setIsPerformingAction(true);
    setActionState({ type: "", message: "" });

    try {
      const updated = await banUserFromComplaint({
        complaintId: selectedComplaint.id,
        banReason: banReason.trim() || selectedComplaint.reason,
      });
      setActionState({
        type: "success",
        message: t("adminComplaints.feedback.banSuccess"),
      });
      if (updated) {
        setComplaints((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setSelectedComplaintId(updated.id);
      }
    } catch (err) {
      console.error("Ban action failed", err);
      setActionState({
        type: "error",
        message: t("adminComplaints.feedback.actionError"),
      });
    } finally {
      await loadComplaints();
      setIsPerformingAction(false);
    }
  };

  const handleStartProgress = async () => {
    if (!selectedComplaint) return;
    setIsPerformingAction(true);
    setActionState({ type: "", message: "" });
      try {
        const updated = await updateComplaintStatus({
          complaintId: selectedComplaint.id,
          status: ComplaintStatus.InReview,
        });
      if (updated) {
        setComplaints((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setSelectedComplaintId(updated.id);
      }
    } catch (err) {
      console.error("Failed to update status", err);
      setActionState({
        type: "error",
        message: t("adminComplaints.feedback.actionError"),
      });
    } finally {
      await loadComplaints();
      setIsPerformingAction(false);
    }
  };

  const handleMarkPending = async () => {
    if (!selectedComplaint) return;
    setIsPerformingAction(true);
    setActionState({ type: "", message: "" });
    try {
      const updated = await updateComplaintStatus({
        complaintId: selectedComplaint.id,
        status: ComplaintStatus.Sent,
      });
      if (updated) {
        setComplaints((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setSelectedComplaintId(updated.id);
      }
    } catch (err) {
      console.error("Failed to update status", err);
      setActionState({
        type: "error",
        message: t("adminComplaints.feedback.actionError"),
      });
    } finally {
      await loadComplaints();
      setIsPerformingAction(false);
    }
  };

  const handleUnban = async () => {
    const targetUserId =
      selectedComplaint?.reportedUser?.id ??
      selectedComplaint?.reportedUserId ??
      selectedComplaint?.reportedUserProfile?.melodyMatchUserId;
    if (!targetUserId) return;
    setIsPerformingAction(true);
    setActionState({ type: "", message: "" });
    try {
      await unbanUser({
        melodyMatchUserId: targetUserId,
        complaintId: selectedComplaint.id,
        reason: resolutionNote.trim(),
      });
      setActionState({
        type: "success",
        message: t("adminComplaints.feedback.unbanSuccess"),
      });
    } catch (err) {
      console.error("Unban failed", err);
      setActionState({
        type: "error",
        message: t("adminComplaints.feedback.actionError"),
      });
    } finally {
      await loadComplaints();
      setIsPerformingAction(false);
    }
  };

  const handleDismiss = async () => {
    if (!selectedComplaint) return;
    setIsPerformingAction(true);
    setActionState({ type: "", message: "" });

    try {
      const updated = await resolveComplaint({
        complaintId: selectedComplaint.id,
        status: ComplaintStatus.Dismissed,
        resolutionNote: resolutionNote.trim(),
      });
      setActionState({
        type: "success",
        message: t("adminComplaints.feedback.dismissSuccess"),
      });
      if (updated) {
        setComplaints((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setSelectedComplaintId(updated.id);
      }
    } catch (err) {
      console.error("Dismiss action failed", err);
      setActionState({
        type: "error",
        message: t("adminComplaints.feedback.actionError"),
      });
    } finally {
      await loadComplaints();
      setIsPerformingAction(false);
    }
  };

  const statusLabel = useCallback(
    (value) => {
      switch (value) {
        case ComplaintStatus.InReview:
        case 1:
          return t("adminComplaints.status.inProgress");
        case ComplaintStatus.Resolved:
          return t("adminComplaints.status.resolved");
        case ComplaintStatus.Dismissed:
          return t("adminComplaints.status.dismissed");
        case ComplaintStatus.Sent:
        default:
          return t("adminComplaints.status.sent");
      }
    },
    [t]
  );

  return (
    <Layout>
      <div className="admin-complaints">
        <header className="admin-complaints__header">
          <div>
            <p className="eyebrow">{t("adminComplaints.eyebrow")}</p>
            <h1>{t("adminComplaints.title")}</h1>
            <p className="helper">{t("adminComplaints.subtitle")}</p>
          </div>

          <form
            className="admin-complaints__filters"
            onSubmit={handleSearchSubmit}
          >
            <label className="filter-field">
              <span>{t("adminComplaints.filters.status")}</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="filter-actions">
              <Button type="submit" size="md">
                {t("adminComplaints.filters.apply")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={loadComplaints}
              >
                {t("adminComplaints.filters.refresh")}
              </Button>
            </div>
          </form>
        </header>

        <div className="admin-complaints__content">
          <section className="complaints-list" aria-label={t("adminComplaints.listAria")}>
            {isLoading ? (
              <div className="complaint-row complaint-row--skeleton" aria-hidden>
                <div className="skeleton-line skeleton-line--md" />
                <div className="skeleton-line skeleton-line--sm" />
                <div className="skeleton-line skeleton-line--xs" />
              </div>
            ) : error ? (
              <p className="complaints__state complaints__state--error">
                {error}
              </p>
            ) : complaints.length === 0 ? (
              <p className="complaints__state">{t("adminComplaints.empty")}</p>
            ) : (
              complaints.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`complaint-row ${
                    item.id === selectedComplaintId ? "is-active" : ""
                  }`}
                  onClick={() => setSelectedComplaintId(item.id)}
                >
                  <div className="complaint-row__head">
                    <p className="complaint-row__id">
                      {t("adminComplaints.complaintId", { id: item.id })}
                    </p>
                    <span
                      className={`status-pill status-pill--${statusKey(
                        item.status
                      )}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <p className="complaint-row__reason">
                    {item.reason || t("adminComplaints.details.noReason")}
                  </p>
                  <div className="complaint-row__meta">
                    <span>
                      {t("adminComplaints.details.reporterValue", {
                        reporter: item.reporterName || t("adminComplaints.details.unknown"),
                      })}
                    </span>
                    <span>
                      {t("adminComplaints.details.reportedValue", {
                        reported: item.reportedUserName || t("adminComplaints.details.unknown"),
                      })}
                    </span>
                    <span>
                      {formatDate(item.creationTime, i18n.language)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </section>

          <section className="complaint-details">
            {selectedComplaint ? (
              <>
                <header className="complaint-details__head">
                  <div>
                    <p className="eyebrow">
                      {t("adminComplaints.details.reportedUser")}
                    </p>
                    <h2>
                      {selectedComplaint.reportedUserName ||
                        t("adminComplaints.details.unknown")}
                    </h2>
                    <p className="helper">
                      {t("adminComplaints.details.reporterLabel", {
                        reporter:
                          selectedComplaint.reporterName ||
                          t("adminComplaints.details.unknown"),
                      })}
                    </p>
                  </div>
                  <span
                    className={`status-pill status-pill--${statusKey(
                      selectedComplaint.status
                    )}`}
                  >
                    {statusLabel(selectedComplaint.status)}
                  </span>
                </header>

                <div className="complaint-details__body">
                  <div className="detail-card">
                    <p className="detail-card__label">
                      {t("adminComplaints.details.reason")}
                    </p>
                    <p className="detail-card__value">
                      {selectedComplaint.reason ||
                        t("adminComplaints.details.noReason")}
                    </p>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-card">
                      <p className="detail-card__label">
                        {t("adminComplaints.details.submitted")}
                      </p>
                      <p className="detail-card__value">
                        {formatDate(selectedComplaint.creationTime, i18n.language) ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  {profile && (
                    <div className="profile-panel">
                      <div className="detail-grid">
                        <div className="detail-card">
                          <p className="detail-card__label">
                            {t("adminComplaints.details.age")}
                          </p>
                          <p className="detail-card__value">
                            {profile.age ?? "—"}
                          </p>
                        </div>
                        <div className="detail-card">
                          <p className="detail-card__label">
                            {t("adminComplaints.details.location")}
                          </p>
                          <p className="detail-card__value">
                            {profile.location || "—"}
                          </p>
                        </div>
                        <div className="detail-card detail-card--wide">
                          <p className="detail-card__label">
                            {t("adminComplaints.details.bio")}
                          </p>
                          <p className="detail-card__value">
                            {profile.bio || t("adminComplaints.details.noBio")}
                          </p>
                        </div>
                      </div>

                      <div className="profile-photos">
                        {profile.profilePhotos?.length ? (
                          profile.profilePhotos.map((photo) => (
                            <div
                              className="profile-photo"
                              key={photo.id ?? photo.url}
                            >
                              <img
                                src={resolveAssetUrl(photo.url)}
                                alt={t("adminComplaints.details.reportedUser")}
                              />
                            </div>
                          ))
                        ) : (
                          <p className="complaints__state">
                            {t("adminComplaints.details.noPhotos")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="moderation-actions">
                    <div className="form-grid">
                      <div className="form-field">
                        <label htmlFor="banReason">
                          {t("adminComplaints.actions.banReason")}
                        </label>
                        <textarea
                          id="banReason"
                          value={banReason}
                          onChange={(event) => setBanReason(event.target.value)}
                          placeholder={t("adminComplaints.actions.banPlaceholder")}
                          rows={3}
                          disabled={isClosed}
                        />
                      </div>

                      <div className="action-buttons">
                        {!isClosed && (
                          <>
                            <Button
                              type="button"
                              onClick={handleBan}
                              disabled={isPerformingAction}
                            >
                              {isPerformingAction
                                ? t("adminComplaints.actions.processing")
                                : t("adminComplaints.actions.banSubmit")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={handleDismiss}
                              disabled={isPerformingAction}
                            >
                              {t("adminComplaints.actions.dismiss")}
                            </Button>
                            {selectedComplaint.status === ComplaintStatus.Sent && (
                              <Button
                                type="button"
                                variant="subtle"
                                onClick={handleStartProgress}
                                disabled={isPerformingAction}
                              >
                                {t("adminComplaints.actions.markInProgress")}
                              </Button>
                            )}
                            {selectedComplaint.status === ComplaintStatus.InReview && (
                              <Button
                                type="button"
                                variant="subtle"
                                onClick={handleMarkPending}
                                disabled={isPerformingAction}
                              >
                                {t("adminComplaints.actions.markPending")}
                              </Button>
                            )}
                          </>
                        )}
                        {selectedComplaint.status === ComplaintStatus.Resolved && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleUnban}
                            disabled={isPerformingAction}
                          >
                            {t("adminComplaints.actions.unban")}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-field">
                        <label htmlFor="resolutionNote">
                          {t("adminComplaints.actions.resolutionNote")}
                        </label>
                        <textarea
                          id="resolutionNote"
                          value={resolutionNote}
                          onChange={(event) =>
                            setResolutionNote(event.target.value)
                          }
                          placeholder={
                            isClosed
                              ? ""
                              : t("adminComplaints.actions.notePlaceholder")
                          }
                          rows={3}
                          disabled={isClosed}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="complaint-details__empty">
                <p>{t("adminComplaints.noSelection")}</p>
              </div>
            )}
          </section>
        </div>

        <FeedbackPopup
          open={Boolean(actionState.message)}
          title={
            actionState.type === "error"
              ? t("adminComplaints.feedback.errorTitle")
              : t("adminComplaints.feedback.successTitle")
          }
          message={actionState.message}
          variant={actionState.type === "error" ? "error" : "success"}
          onClose={() => setActionState({ type: "", message: "" })}
        />
      </div>
    </Layout>
  );
}
