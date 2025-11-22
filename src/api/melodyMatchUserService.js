import { apiClient } from "./httpClient";
import {
  MelodyMatchUserDto,
  MelodyMatchUserQueryDto,
  MelodyMatchUserRequestDto,
} from "../dto/melodyMatchUser/MelodyMatchUserDto";

const BASE_URL = "/api/app/melody-match-user";

function ensureRequestDto(payload) {
  return payload instanceof MelodyMatchUserRequestDto
    ? payload
    : new MelodyMatchUserRequestDto(payload);
}

export async function fetchMelodyMatchUsers(query) {
  const dto =
    query instanceof MelodyMatchUserQueryDto
      ? query
      : new MelodyMatchUserQueryDto(query);
  const { data } = await apiClient.get(BASE_URL, {
    params: dto.toQueryParams(),
  });

  return {
    items: (data.items ?? []).map((item) => new MelodyMatchUserDto(item)),
    totalCount: data.totalCount ?? 0,
  };
}

export async function getMelodyMatchUserById(id) {
  const { data } = await apiClient.get(`${BASE_URL}/${id}/by-id`);
  return new MelodyMatchUserDto(data);
}

export async function getMelodyMatchUserByIdentityUserId(identityUserId) {
  const { data } = await apiClient.get(
    `${BASE_URL}/by-identity-user-id/${identityUserId}`
  );
  return new MelodyMatchUserDto(data);
}

export async function getMelodyMatchUserByUsername(username) {
  const { data } = await apiClient.get(`${BASE_URL}/by-username`, {
    params: { username },
  });
  return new MelodyMatchUserDto(data);
}

export async function createMelodyMatchUser(payload) {
  const dto = ensureRequestDto(payload);
  const { data } = await apiClient.post(BASE_URL, dto.toPayload());
  return new MelodyMatchUserDto(data);
}

export async function updateMelodyMatchUser(payload) {
  const dto = ensureRequestDto(payload);
  const { data } = await apiClient.put(BASE_URL, dto.toPayload());
  return new MelodyMatchUserDto(data);
}

export async function upsertMelodyMatchUser(payload) {
  const dto = ensureRequestDto(payload);
  return dto.id ? updateMelodyMatchUser(dto) : createMelodyMatchUser(dto);
}

export async function deleteMelodyMatchUserById(id) {
  await apiClient.delete(`${BASE_URL}/${id}/by-id`);
}

export async function deleteMelodyMatchUserByIdentityUserId(identityUserId) {
  await apiClient.delete(`${BASE_URL}/by-identity-user-id/${identityUserId}`);
}
