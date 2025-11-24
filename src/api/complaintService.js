import { apiClient } from "./httpClient";
import { ComplaintRequestDto } from "../dto/match/MatchSuggestionDto";

const COMPLAINT_URL = "/api/app/complaint/complaint";

function ensureComplaintDto(payload) {
  return payload instanceof ComplaintRequestDto
    ? payload
    : new ComplaintRequestDto(payload);
}

export async function submitComplaint(payload) {
  const dto = ensureComplaintDto(payload);
  const { data } = await apiClient.post(COMPLAINT_URL, dto.toPayload());
  return data ?? null;
}
