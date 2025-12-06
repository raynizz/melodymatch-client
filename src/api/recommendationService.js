import { apiClient } from "./httpClient";
import { MatchSuggestionDto } from "../dto/match/MatchSuggestionDto";

const RECOMMENDATION_URL = "/api/app/recommendation";

export async function fetchSuggestionsForCurrentUser({ take } = {}) {
  const { data } = await apiClient.get(`${RECOMMENDATION_URL}/suggestions-for-current-user`, {
    params: take ? { take } : undefined,
  });

  return (data ?? []).map((item) => new MatchSuggestionDto(item));
}

export async function fetchLikedForCurrentProfileUsers({ take } = {}) {
  const { data } = await apiClient.get(`${RECOMMENDATION_URL}/like-current-profile-users`, {
    params: take ? { take } : undefined,
  });

  return (data ?? []).map((item) => new MatchSuggestionDto(item));
}