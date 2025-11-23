import { apiClient } from "./httpClient";
import { MatchSuggestionDto } from "../dto/match/MatchSuggestionDto";

const SUGGESTIONS_URL = "/api/app/recommendation/suggestions-for-current-user";

export async function fetchSuggestionsForCurrentUser({ take } = {}) {
  const { data } = await apiClient.get(SUGGESTIONS_URL, {
    params: take ? { take } : undefined,
  });

  return (data ?? []).map((item) => new MatchSuggestionDto(item));
}
