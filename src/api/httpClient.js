import axios from "axios";
import i18n from "../i18n";
import {
  API_HOST,
  AUTH_HOST,
  AUTH_SCOPE,
  AUTH_TOKEN_ENDPOINT,
  CLIENT_ID,
} from "./constants";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../utils/token";

const authClient = axios.create({
  baseURL: AUTH_HOST,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

const apiClient = axios.create({
  baseURL: API_HOST,
});

const getLanguage = () =>
  i18n.language && i18n.language.startsWith("uk") ? "uk" : "en";

apiClient.interceptors.request.use((config) => {
  const configCopy = { ...config };
  configCopy.headers = configCopy.headers ?? {};
  configCopy.headers["Accept-Language"] = getLanguage();
  const token = getAccessToken();
  if (token) {
    configCopy.headers.Authorization = `Bearer ${token}`;
  }
  return configCopy;
});

let refreshPromise = null;

async function requestTokenRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  if (!refreshPromise) {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      scope: AUTH_SCOPE,
      refresh_token: refreshToken,
    });

    refreshPromise = authClient
      .post(AUTH_TOKEN_ENDPOINT, params)
      .then((response) => {
        const { access_token, refresh_token } = response.data;
        setTokens({
          accessToken: access_token,
          refreshToken: refresh_token ?? refreshToken,
        });
        return response.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshed = await requestTokenRefresh();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient, authClient };
