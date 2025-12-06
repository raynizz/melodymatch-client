import { APP_NAME, REGISTER_ENDPOINT } from "./constants";
import { apiClient } from "./httpClient";

export async function registerAccount(payload) {
  const body = {
    ...payload,
    appName: APP_NAME,
  };

  const { data } = await apiClient.post(REGISTER_ENDPOINT, body);
  return data;
}
