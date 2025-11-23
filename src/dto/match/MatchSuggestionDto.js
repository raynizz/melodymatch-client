export class MatchSuggestionDto {
  constructor(payload = {}) {
    this.melodyMatchUserId = payload.melodyMatchUserId ?? "";
    this.name = payload.name ?? "";
    this.age = typeof payload.age === "number" ? payload.age : null;
    this.location = payload.location ?? "";
    this.bio = payload.bio ?? "";
    this.photosUrls = Array.isArray(payload.photosUrls)
      ? payload.photosUrls
      : [];
    this.interests = Array.isArray(payload.interests)
      ? payload.interests
      : [];
    this.gender = payload.gender ?? "";
  }

  get primaryPhoto() {
    if (this.photosUrls.length === 0) return "";
    return this.photosUrls[0];
  }
}

export class ReactionRequestDto {
  constructor({ fromUserId, toUserId, type, message } = {}) {
    this.fromUserId = fromUserId ?? "";
    this.toUserId = toUserId ?? "";
    this.type = typeof type === "number" ? type : 0;
    this.message = message ?? "";
  }

  toPayload() {
    return {
      fromUserId: this.fromUserId,
      toUserId: this.toUserId,
      type: this.type,
      message: this.message,
    };
  }
}

export class ComplaintRequestDto {
  constructor({ reporterId, reportedUserId, reason, status } = {}) {
    this.reporterId = reporterId ?? "";
    this.reportedUserId = reportedUserId ?? "";
    this.reason = reason ?? "";
    this.status = typeof status === "number" ? status : 0;
  }

  toPayload() {
    return {
      reporterId: this.reporterId,
      reportedUserId: this.reportedUserId,
      reason: this.reason,
      status: this.status,
    };
  }
}
