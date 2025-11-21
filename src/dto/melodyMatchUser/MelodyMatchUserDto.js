import {
  mergeQueryParams,
  PagedRequestDto,
} from "../common/PagedRequestDto";
import { IdentityUserDto } from "../identity/IdentityUserDto";
import { UserProfileDto } from "../userProfile/UserProfileDto";

export class MelodyMatchUserDto {
  constructor(payload = {}) {
    this.id = payload.id ?? null;
    this.identityUserId = payload.identityUserId ?? payload.identityUser?.id ?? null;
    this.gender = payload.gender ?? 0;
    this.avatarUrl = payload.avatarUrl ?? "";
    this.identityUser = payload.identityUser
      ? new IdentityUserDto(payload.identityUser)
      : null;
    this.userProfile = payload.userProfile
      ? new UserProfileDto(payload.userProfile)
      : null;
  }

  static empty() {
    return new MelodyMatchUserDto({
      gender: 0,
      avatarUrl: "",
    });
  }
}

export class MelodyMatchUserRequestDto {
  constructor({ id, identityUserId, gender, avatarUrl } = {}) {
    this.id = id ?? undefined;
    this.identityUserId = identityUserId ?? undefined;
    this.gender = typeof gender === "number" ? gender : 0;
    this.avatarUrl = avatarUrl ?? "";
  }

  toPayload() {
    const payload = {
      identityUserId: this.identityUserId,
      gender: this.gender,
      avatarUrl: this.avatarUrl,
    };

    if (this.id) {
      payload.id = this.id;
    }

    return payload;
  }
}

export class MelodyMatchUserQueryDto extends PagedRequestDto {
  constructor({ gender, ...rest } = {}) {
    super(rest);
    this.gender = gender ?? undefined;
  }

  toQueryParams() {
    const pagination = super.toQueryParams();
    return mergeQueryParams(pagination, {
      Gender: this.gender,
    });
  }
}
