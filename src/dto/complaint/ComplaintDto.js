import { ComplaintStatus } from "../../types/match";
import { UserProfileDto } from "../userProfile/UserProfileDto";

function normalizeUser(payload = {}) {
  const identity = payload.identityUser ?? payload.IdentityUser ?? {};
  const id =
    payload.id ??
    payload.Id ??
    payload.melodyMatchUserId ??
    payload.MelodyMatchUserId ??
    payload.userId ??
    payload.UserId ??
    payload.reporterId ??
    payload.ReporterId ??
    identity.id ??
    identity.Id ??
    "";

  const avatarUrl =
    payload.avatarUrl ??
    identity.avatarUrl ??
    identity.avatar ??
    identity.picture ??
    identity.profileImage ??
    "";

  const displayName = [identity.name, identity.surname]
    .filter(Boolean)
    .join(" ")
    .trim() ||
    payload.userName ||
    payload.username ||
    payload.email ||
    identity.userName ||
    identity.username ||
    identity.email ||
    "";

  return {
    id,
    avatarUrl,
    displayName,
    userName: identity.userName ?? identity.username ?? "",
  };
}

export class ComplaintDto {
  constructor(payload = {}) {
    this.id =
      payload.id ??
      payload.Id ??
      payload.complaintId ??
      payload.ComplaintId ??
      "";
    this.reason = payload.reason ?? payload.Reason ?? "";
    const statusValue =
      typeof payload.status === "number"
        ? payload.status
        : typeof payload.Status === "number"
          ? payload.Status
          : ComplaintStatus.Sent;
    this.status = statusValue;
    this.resolutionNote =
      payload.resolutionNote ?? payload.ResolutionNote ?? payload.note ?? "";
    this.banReason = payload.banReason ?? payload.BanReason ?? "";
    this.complaintId = payload.complaintId ?? payload.ComplaintId ?? this.id;
    this.reporter = payload.reporter
      ? normalizeUser(payload.reporter)
      : payload.Reporter
        ? normalizeUser(payload.Reporter)
        : null;
    this.reportedUser = payload.reportedUser
      ? normalizeUser(payload.reportedUser)
      : payload.ReportedUser
        ? normalizeUser(payload.ReportedUser)
        : null;
    this.reporterId =
      payload.reporterId ?? payload.ReporterId ?? this.reporter?.id ?? "";
    this.reportedUserId =
      payload.reportedUserId ??
      payload.ReportedUserId ??
      this.reportedUser?.id ??
      "";
    this.creationTime =
      payload.creationTime ??
      payload.CreationTime ??
      payload.creationDate ??
      null;
    this.reportedUserProfile = payload.reportedUserProfile
      ? new UserProfileDto(payload.reportedUserProfile)
      : payload.ReportedUserProfile
        ? new UserProfileDto(payload.ReportedUserProfile)
        : null;
  }

  get reporterName() {
    return this.reporter?.displayName || this.reporter?.userName || "";
  }

  get reportedUserName() {
    return this.reportedUser?.displayName || this.reportedUser?.userName || "";
  }
}
