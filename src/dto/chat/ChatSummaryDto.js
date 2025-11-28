export class ChatParticipantDto {
  constructor(payload = {}) {
    this.id =
      payload.id ??
      payload.Id ??
      payload.userId ??
      payload.UserId ??
      payload.identityUser?.id ??
      payload.identityUser?.Id ??
      "";
    this.identityUser = payload.identityUser ?? payload.IdentityUser ?? null;
    this.avatarUrl =
      payload.avatarUrl ??
      payload.identityUser?.avatarUrl ??
      payload.identityUser?.avatar ??
      payload.identityUser?.profileImage ??
      payload.identityUser?.picture ??
      payload.IdentityUser?.avatarUrl ??
      payload.IdentityUser?.avatar ??
      payload.IdentityUser?.profileImage ??
      payload.IdentityUser?.picture ??
      "";
    this.isOnline = Boolean(
      payload.isOnline ??
      payload.IsOnline ??
      payload.identityUser?.isOnline
    );
  }

  get displayName() {
    const identity = this.identityUser ?? {};
    const fullName = [identity.name, identity.surname].filter(Boolean).join(" ").trim();
    if (fullName) return fullName;
    return identity.userName ?? identity.email ?? "";
  }
}

export class ChatMessageDto {
  constructor(payload = {}) {
    const normalizeId = (value) => {
      if (value === null || typeof value === "undefined") return "";
      return value.toString();
    };

    this.id = normalizeId(
      payload.id ??
      payload.Id ??
      payload.messageId ??
      payload.MessageId
    );
    this.content = payload.content ?? payload.Content ?? "";
    this.isRead = Boolean(payload.isRead ?? payload.IsRead);
    this.creationTime = payload.creationTime ?? payload.CreationTime ?? null;
    this.chatId = normalizeId(
      payload.chatId ??
      payload.ChatId ??
      payload.chat?.id ??
      payload.Chat?.Id
    );
    
    const senderPayload =
      payload.sender ??
      payload.Sender ??
      (payload.senderId || payload.SenderId
        ? { id: payload.senderId ?? payload.SenderId }
        : null);

    if (senderPayload && typeof senderPayload === "object") {
      this.sender = new ChatParticipantDto(senderPayload);
    } else {
      this.sender = null;
    }

    this.senderId = normalizeId(
      this.sender?.id ||
      payload.senderId ||
      payload.SenderId ||
      payload.sender?.id ||
      payload.Sender?.Id
    );
  }
}

export class ChatSummaryDto {
  constructor(payload = {}) {
    this.id = payload.id ?? "";
    this.participants = Array.isArray(payload.participants)
      ? payload.participants.map((p) => new ChatParticipantDto(p))
      : [];
    this.lastMessage = payload.lastMessage ? new ChatMessageDto(payload.lastMessage) : null;
    this.unreadCount = typeof payload.unreadCount === "number" ? payload.unreadCount : 0;
    this.creationTime = payload.creationTime ?? null;
  }

  get otherParticipantId() {
    if (this.participants.length === 0) return null;
    return this.participants[0].id ?? null;
  }

  findCompanion(currentUserId) {
    if (this.participants.length === 0) return null;
    if (!currentUserId) return this.participants[0];

    const isCurrentUser = (participant) => {
      if (!participant) return false;
      return (
        participant.id === currentUserId ||
        participant.identityUser?.id === currentUserId
      );
    };

    return this.participants.find((p) => !isCurrentUser(p)) ?? this.participants[0];
  }
}
