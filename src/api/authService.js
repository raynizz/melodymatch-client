import { AUTH_SCOPE, AUTH_TOKEN_ENDPOINT, CLIENT_ID } from "./constants";
import { authClient } from "./httpClient";

function buildFormData(payload) {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return params;
}

export async function loginRequest({ username, password }) {
  const params = buildFormData({
    grant_type: "password",
    client_id: CLIENT_ID,
    scope: AUTH_SCOPE,
    username,
    password,
  });

  const { data } = await authClient.post(AUTH_TOKEN_ENDPOINT, params);
  return data;
}

export async function refreshTokenRequest(refreshToken) {
  const params = buildFormData({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    scope: AUTH_SCOPE,
    refresh_token: refreshToken,
  });

  const { data } = await authClient.post(AUTH_TOKEN_ENDPOINT, params);
  return data;
}
