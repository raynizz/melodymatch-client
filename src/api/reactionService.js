import { apiClient } from "./httpClient";
import { ReactionRequestDto } from "../dto/match/MatchSuggestionDto";

const REACTIONS_URL = "/api/app/reaction/reaction";

function ensureReactionDto(payload) {
  return payload instanceof ReactionRequestDto
    ? payload
    : new ReactionRequestDto(payload);
}

export async function submitReaction(payload) {
  const dto = ensureReactionDto(payload);
  const { data } = await apiClient.post(REACTIONS_URL, dto.toPayload());
  return data ?? null;
}
