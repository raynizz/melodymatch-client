export class ChatParticipantDto {
  constructor(payload = {}) {
    this.id = payload.id ?? payload.identityUser?.id ?? "";
    this.identityUser = payload.identityUser ?? null;
    this.avatarUrl =
      payload.avatarUrl ??
      payload.identityUser?.avatarUrl ??
      payload.identityUser?.avatar ??
      payload.identityUser?.profileImage ??
      payload.identityUser?.picture ??
      "";
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
    this.id = payload.id ?? "";
    this.content = payload.content ?? "";
    this.isRead = Boolean(payload.isRead);
    this.creationTime = payload.creationTime ?? null;
    this.chatId = payload.chatId ?? payload.chat?.id ?? null;
    
    if (payload.sender && typeof payload.sender === 'object') {
      this.sender = new ChatParticipantDto(payload.sender);
    } else if (payload.senderId) {
      this.sender = new ChatParticipantDto({ id: payload.senderId });
    } else {
      this.sender = null;
    }
    
    this.senderId = this.sender?.id || payload.senderId || "";
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
