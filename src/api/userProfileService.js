import { apiClient } from "./httpClient";
import {
  UserProfileDto,
  UserProfileQueryDto,
  UserProfileRequestDto,
} from "../dto/userProfile/UserProfileDto";

const BASE_URL = "/api/app/user-profile";

function ensureRequestDto(payload) {
  return payload instanceof UserProfileRequestDto
    ? payload
    : new UserProfileRequestDto(payload);
}

export async function fetchUserProfiles(query) {
  const dto =
    query instanceof UserProfileQueryDto
      ? query
      : new UserProfileQueryDto(query);
  const { data } = await apiClient.get(BASE_URL, {
    params: dto.toQueryParams(),
  });

  return {
    items: (data.items ?? []).map((item) => new UserProfileDto(item)),
    totalCount: data.totalCount ?? 0,
  };
}

export async function getUserProfileById(id) {
  const { data } = await apiClient.get(`${BASE_URL}/${id}/by-id`);
  return new UserProfileDto(data);
}

export async function getUserProfileByMelodyMatchUserId(melodyMatchUserId) {
  const { data } = await apiClient.get(
    `${BASE_URL}/by-melody-match-user-id/${melodyMatchUserId}`
  );
  return new UserProfileDto(data);
}

export async function createUserProfile(payload) {
  const dto = ensureRequestDto(payload);
  const { data } = await apiClient.post(BASE_URL, dto.toPayload());
  return new UserProfileDto(data);
}

export async function updateUserProfile(payload) {
  const dto = ensureRequestDto(payload);
  const { data } = await apiClient.put(BASE_URL, dto.toPayload());
  return new UserProfileDto(data);
}

export async function upsertUserProfile(payload) {
  const dto = ensureRequestDto(payload);
  return dto.id ? updateUserProfile(dto) : createUserProfile(dto);
}

export async function deleteUserProfileById(id) {
  await apiClient.delete(`${BASE_URL}/${id}/by-id`);
}

export async function deleteUserProfileByMelodyMatchUserId(
  melodyMatchUserId
) {
  await apiClient.delete(
    `${BASE_URL}/by-melody-match-user-id/${melodyMatchUserId}`
  );
}
