import { apiClient } from "./httpClient";
import { ChatSummaryDto, ChatMessageDto } from "../dto/chat/ChatSummaryDto";

const CHAT_URL = "/api/app/chat";
const MESSAGE_URL = "/api/app/message";

export async function fetchChatById(chatId) {
  if (!chatId) return null;
  const { data } = await apiClient.get(`${CHAT_URL}/chat/${chatId}`);
  return data ? new ChatSummaryDto(data) : null;
}

export async function fetchUserChats({ skipCount = 0, maxResultCount = 20 } = {}) {
  const { data } = await apiClient.get(`${CHAT_URL}/user-chats`, {
    params: { skipCount, maxResultCount },
  });

  return {
    items: (data?.items ?? []).map((item) => new ChatSummaryDto(item)),
    totalCount: data?.totalCount ?? 0,
  };
}

export async function fetchChatMessages(chatId) {
  if (!chatId) return [];
  const { data } = await apiClient.get(`${MESSAGE_URL}/messages/${chatId}`);
  return (data ?? []).map((item) => new ChatMessageDto(item));
}

export async function deleteChatById(chatId) {
  if (!chatId) return;
  await apiClient.delete(`${CHAT_URL}/chat/${chatId}`);
}