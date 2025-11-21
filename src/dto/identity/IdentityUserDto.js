export class IdentityUserDto {
  constructor(payload = {}) {
    this.id = payload.id ?? null;
    this.userName = payload.userName ?? "";
    this.name = payload.name ?? "";
    this.surname = payload.surname ?? "";
    this.email = payload.email ?? "";
    this.phoneNumber = payload.phoneNumber ?? "";
    this.isActive = payload.isActive ?? true;
    this.lockoutEnabled = payload.lockoutEnabled ?? true;
    this.roleNames = payload.roleNames ?? [];
    this.avatarUrl = payload.avatarUrl ?? payload.avatar ?? "";
    this.concurrencyStamp = payload.concurrencyStamp ?? null;
  }

  get displayName() {
    if (this.name || this.surname) {
      return `${this.name ?? ""} ${this.surname ?? ""}`.trim();
    }
    return this.userName || this.email || "";
  }

  static empty() {
    return new IdentityUserDto({
      isActive: true,
      lockoutEnabled: true,
      roleNames: [],
    });
  }
}

export class IdentityUserRequestDto {
  constructor({
    userName,
    name,
    surname,
    email,
    phoneNumber,
    isActive,
    lockoutEnabled,
    roleNames,
    password,
    concurrencyStamp,
  } = {}) {
    this.userName = userName ?? "";
    this.name = name ?? "";
    this.surname = surname ?? "";
    this.email = email ?? "";
    this.phoneNumber = phoneNumber ?? "";
    this.isActive = isActive ?? true;
    this.lockoutEnabled = lockoutEnabled ?? true;
    this.roleNames = roleNames ?? [];
    this.password = password ?? undefined;
    this.concurrencyStamp = concurrencyStamp ?? undefined;
  }

  toPayload() {
    const payload = {
      userName: this.userName,
      name: this.name,
      surname: this.surname,
      email: this.email,
      phoneNumber: this.phoneNumber,
      isActive: this.isActive,
      lockoutEnabled: this.lockoutEnabled,
    };

    if (this.roleNames?.length) {
      payload.roleNames = this.roleNames;
    }

    if (this.password) {
      payload.password = this.password;
    }

    if (this.concurrencyStamp) {
      payload.concurrencyStamp = this.concurrencyStamp;
    }

    return payload;
  }
}
