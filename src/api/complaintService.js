import { apiClient } from "./httpClient";
import { ComplaintRequestDto } from "../dto/match/MatchSuggestionDto";
import { ComplaintDto } from "../dto/complaint/ComplaintDto";

const COMPLAINT_BASE_URL = "/api/app/complaint";
const COMPLAINT_CREATE_URL = `${COMPLAINT_BASE_URL}/complaint`;

function ensureComplaintDto(payload) {
  return payload instanceof ComplaintRequestDto
    ? payload
    : new ComplaintRequestDto(payload);
}

export async function submitComplaint(payload) {
  const dto = ensureComplaintDto(payload);
  const { data } = await apiClient.post(COMPLAINT_CREATE_URL, dto.toPayload());
  return data ?? null;
}

export async function fetchComplaints({
  status,
  skipCount = 0,
  maxResultCount = 50,
} = {}) {
  const params = {
    skipCount,
    maxResultCount,
  };

  if (typeof status === "number") {
    params.status = status;
  }

  const { data } = await apiClient.get(COMPLAINT_BASE_URL, { params });

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];
  const totalCount = typeof data?.totalCount === "number"
    ? data.totalCount
    : typeof data?.TotalCount === "number"
      ? data.TotalCount
      : items.length;

  return {
    items: items.map((item) => new ComplaintDto(item)),
    totalCount,
  };
}

export async function banUserFromComplaint({
  complaintId,
  banReason,
} = {}) {
  const payload = {
    complaintId,
    banReason,
  };

  const { data } = await apiClient.post(
    `${COMPLAINT_BASE_URL}/ban-user-from-complaint`,
    payload
  );

  return data ? new ComplaintDto(data) : null;
}

export async function fetchComplaintById(complaintId) {
  if (!complaintId) return null;
  const { data } = await apiClient.get(`${COMPLAINT_BASE_URL}/${complaintId}/by-id`);
  return data ? new ComplaintDto(data) : null;
}

export async function updateComplaintStatus({ complaintId, status } = {}) {
  if (!complaintId) return null;
  const payload = { complaintId, status };
  const { data } = await apiClient.put(
    `${COMPLAINT_BASE_URL}/complaint-status`,
    payload
  );
  return data ? new ComplaintDto(data) : null;
}

export async function unbanUser({ melodyMatchUserId, complaintId, reason } = {}) {
  if (!melodyMatchUserId) return;
  const payload = { userId: melodyMatchUserId };
  if (complaintId) {
    payload.complaintId = complaintId;
  }
  if (reason) {
    payload.reason = reason;
  }
  await apiClient.post(`${COMPLAINT_BASE_URL}/unban-user`, payload);
}

export async function resolveComplaint({
  complaintId,
  status = 3,
  resolutionNote = "",
} = {}) {
  const payload = {
    complaintId,
    status,
    resolutionNote,
  };

  const { data } = await apiClient.post(
    `${COMPLAINT_BASE_URL}/resolve-complaint`,
    payload
  );

  return data ? new ComplaintDto(data) : null;
}
