import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../../layout/layout/Layout";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { fetchUserChats } from "../../api/chatService";
import { resolveAssetUrl } from "../../utils/url";
import "./ChatPage.css";

const PAGE_SIZE = 20;

function formatTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  return isSameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString();
}

function ChatAvatar({ participant, title }) {
  const avatarUrl = resolveAssetUrl(participant?.avatarUrl);
  const initial =
    participant?.displayName?.trim()?.[0]?.toUpperCase() ?? (title?.[0] || "M");

  return (
    <div className="chat-card__avatar" aria-hidden>
      {avatarUrl ? (
        <img src={avatarUrl} alt={title || ""} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function ChatCard({
  chat,
  currentUserId,
  onSelect,
  fallbackName,
  emptyPreviewLabel,
}) {
  const companion = chat.findCompanion(currentUserId);
  const title =
    companion?.displayName?.trim() ||
    fallbackName ||
    "";
  const timestamp = formatTimestamp(
    chat.lastMessage?.creationTime ?? chat.creationTime
  );
  
  let preview = emptyPreviewLabel || "";
  if (chat.lastMessage?.content) {
    const content = chat.lastMessage.content.trim();
    preview = content.length > 50 ? content.substring(0, 50) + "..." : content;
  }

  return (
    <button type="button" className="chat-card" onClick={() => onSelect?.(chat)}>
      <ChatAvatar participant={companion} title={title} />

      <div className="chat-card__body">
        <div className="chat-card__row">
          <p className="chat-card__title">{title}</p>
          {timestamp && <span className="chat-card__time">{timestamp}</span>}
        </div>
        <div className="chat-card__row">
          <p className="chat-card__preview">
            {preview}
          </p>
          {chat.unreadCount > 0 && (
            <span className="chat-card__badge">{chat.unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function ChatSkeleton() {
  return (
    <div className="chat-card chat-card--skeleton" aria-hidden>
      <div className="chat-card__avatar" />
      <div className="chat-card__body">
        <div className="chat-card__row">
          <span className="skeleton-line skeleton-line--lg" />
          <span className="skeleton-line skeleton-line--sm" />
        </div>
        <div className="chat-card__row">
          <span className="skeleton-line skeleton-line--md" />
          <span className="skeleton-badge" />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { t } = useTranslation();
  const { isAuthenticated, identityUserId } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadChats = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { items } = await fetchUserChats({
        skipCount: 0,
        maxResultCount: PAGE_SIZE,
      });
      setChats(items);
    } catch (err) {
      console.error("Failed to fetch chats", err);
      setError(t("chats.states.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadChats();
  }, [isAuthenticated, loadChats]);

  const statusMessage = useMemo(() => {
    if (error) return error;
    if (isLoading && chats.length === 0) return t("chats.states.loading");
    if (!isLoading && chats.length === 0) return t("chats.states.empty");
    return "";
  }, [chats.length, error, isLoading, t]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="chats-page">
        <header className="chats-page__header">
          <div>
            <p className="eyebrow">{t("chats.eyebrow")}</p>
            <h1>{t("chats.title")}</h1>
            <p className="helper">{t("chats.subtitle")}</p>
          </div>

          <div className="chats-page__actions">
            <Button
              variant="ghost"
              size="md"
              onClick={loadChats}
              disabled={isLoading}
            >
              {t("chats.actions.refresh")}
            </Button>
          </div>
        </header>

        {statusMessage && (
          <div className="chats-page__status">{statusMessage}</div>
        )}

        <div className="chat-list">
          {isLoading && chats.length === 0
            ? Array.from({ length: 4 }).map((_, idx) => (
                <ChatSkeleton key={idx} />
              ))
            : chats.map((chat) => (
                <ChatCard
                  key={chat.id}
                  chat={chat}
                  currentUserId={identityUserId}
                  fallbackName={t("chats.labels.fallbackName")}
                  emptyPreviewLabel={t("chats.labels.noMessages")}
                  onSelect={(selected) => navigate(`/chats/${selected.id}`)}
                />
              ))}
        </div>
      </div>
    </Layout>
  );
}
