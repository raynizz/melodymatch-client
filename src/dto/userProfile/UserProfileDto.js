import {
  mergeQueryParams,
  PagedRequestDto,
} from "../common/PagedRequestDto";

export class UserProfileDto {
  constructor(payload = {}) {
    this.id = payload.id ?? null;
    this.melodyMatchUserId = payload.melodyMatchUserId ?? null;
    this.age = payload.age ?? null;
    this.bio = payload.bio ?? "";
    this.location = payload.location ?? "";
    this.preferredGenders = payload.preferredGenders ?? [];
    this.preferredMinAge = payload.preferredMinAge ?? null;
    this.preferredMaxAge = payload.preferredMaxAge ?? null;
    this.interests = payload.interests ?? [];
    this.profilePhotos = (payload.profilePhotos ?? []).map((photo) => ({
      id: photo.id ?? null,
      url: photo.url ?? "",
      isConfirmed: Boolean(photo.isConfirmed),
      userProfileId: photo.userProfileId ?? null,
    }));
  }

  static empty() {
    return new UserProfileDto({
      preferredGenders: [],
      interests: [],
      profilePhotos: [],
    });
  }
}

export class UserProfileRequestDto {
  constructor({
    id,
    melodyMatchUserId,
    age,
    bio,
    location,
    preferredGenders = [],
    preferredMinAge,
    preferredMaxAge,
    profilePhotoUrls = [],
    interests = [],
  } = {}) {
    this.id = id ?? undefined;
    this.melodyMatchUserId = melodyMatchUserId ?? undefined;
    this.age = age ?? undefined;
    this.bio = bio ?? "";
    this.location = location ?? "";
    this.preferredGenders = preferredGenders;
    this.preferredMinAge = preferredMinAge ?? undefined;
    this.preferredMaxAge = preferredMaxAge ?? undefined;
    this.profilePhotoUrls = profilePhotoUrls;
    this.interests = interests;
  }

  toPayload() {
    const payload = {
      melodyMatchUserId: this.melodyMatchUserId,
      age: this.age,
      bio: this.bio,
      location: this.location,
      preferredGenders: this.preferredGenders,
      preferredMinAge: this.preferredMinAge,
      preferredMaxAge: this.preferredMaxAge,
      profilePhotoUrls: this.profilePhotoUrls,
      interests: this.interests,
    };

    if (this.id) {
      payload.id = this.id;
    }
    return payload;
  }
}

export class UserProfileQueryDto extends PagedRequestDto {
  constructor({
    age,
    bio,
    location,
    preferredGenders,
    preferredMinAge,
    preferredMaxAge,
    interests,
    ...rest
  } = {}) {
    super(rest);
    this.age = age ?? undefined;
    this.bio = bio ?? undefined;
    this.location = location ?? undefined;
    this.preferredGenders = preferredGenders ?? [];
    this.preferredMinAge = preferredMinAge ?? undefined;
    this.preferredMaxAge = preferredMaxAge ?? undefined;
    this.interests = interests ?? [];
  }

  toQueryParams() {
    const pagination = super.toQueryParams();
    return mergeQueryParams(pagination, {
      Age: this.age,
      Bio: this.bio,
      Location: this.location,
      PreferredGenders: this.preferredGenders,
      PreferredMinAge: this.preferredMinAge,
      PreferredMaxAge: this.preferredMaxAge,
      Interests: this.interests,
    });
  }
}
