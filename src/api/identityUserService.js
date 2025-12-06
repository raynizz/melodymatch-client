import { apiClient } from "./httpClient";
import {
  IdentityUserDto,
  IdentityUserRequestDto,
} from "../dto/identity/IdentityUserDto";

const BASE_URL = "/api/app/identity-user";

export async function getIdentityUserById(id) {
  const { data } = await apiClient.get(`${BASE_URL}/${id}/by-id`);
  return new IdentityUserDto(data);
}

export async function getIdentityUserByEmail(email) {
  const { data } = await apiClient.get(`${BASE_URL}/${email}/by-email`);
  return new IdentityUserDto(data);
}

export async function getIdentityUserByUsername(username) {
  const { data } = await apiClient.get(`${BASE_URL}/${username}/by-username`);
  return new IdentityUserDto(data);
}

export async function updateIdentityUser(id, payload) {
  const dto =
    payload instanceof IdentityUserRequestDto
      ? payload
      : new IdentityUserRequestDto(payload);
  const { data } = await apiClient.put(`${BASE_URL}/${id}`, dto.toPayload());
  return new IdentityUserDto(data);
}

export async function deleteIdentityUserById(id) {
  await apiClient.delete(`${BASE_URL}/${id}`);
}
