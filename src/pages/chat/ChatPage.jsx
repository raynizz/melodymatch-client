import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PiXBold } from "react-icons/pi";
import Layout from "../../layout/layout/Layout";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { fetchUserChats, deleteChatById } from "../../api/chatService";
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
  onDelete,
  onSwipeOpen,
  onSwipeClose,
  isSwiped,
  fallbackName,
  emptyPreviewLabel,
}) {
  const { t } = useTranslation();
  const [dragStartX, setDragStartX] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragMovedRef = useRef(false);

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

  const handleStart = (event) => {
    const x = event.touches?.[0]?.clientX ?? event.clientX;
    setDragStartX(x);
    dragMovedRef.current = false;
  };

  const handleMove = (event) => {
    if (dragStartX === null) return;
    const x = event.touches?.[0]?.clientX ?? event.clientX;
    const delta = x - dragStartX;
    if (Math.abs(delta) > 4) {
      dragMovedRef.current = true;
    }
    const clamped = Math.max(-120, Math.min(0, delta));
    setDragOffset(clamped);
  };

  const handleEnd = () => {
    if (dragStartX === null) return;
    if (dragOffset < -60) {
      onSwipeOpen?.(chat.id);
      setDragOffset(-120);
    } else {
      onSwipeClose?.();
      setDragOffset(0);
    }
    setDragStartX(null);
  };

  useEffect(() => {
    setDragOffset(isSwiped ? -120 : 0);
  }, [isSwiped]);

  const handleCardClick = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    if (isSwiped) {
      return;
    }
    onSelect?.(chat);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(chat);
  };

  return (
    <div
      className={`chat-card__wrapper ${isSwiped ? "is-swiped" : ""}`}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseMove={(e) => dragStartX !== null && handleMove(e)}
      onMouseUp={handleEnd}
    >
      <button
        type="button"
        className="chat-card__delete"
        aria-label={t("chats.actions.deleteChat")}
        onClick={handleDelete}
      >
        <PiXBold aria-hidden />
      </button>
    <button
      type="button"
      className="chat-card"
      onClick={handleCardClick}
      style={{ transform: `translateX(${dragOffset}px)` }}
    >
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
    </div>
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
  const [swipedChatId, setSwipedChatId] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);

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
    setSwipedChatId(null);
  }, [isAuthenticated, loadChats]);

  const handleDeleteChat = useCallback(async (chat) => {
    if (!chat?.id) return;
    setChatToDelete(chat);
  }, []);

  const statusMessage = useMemo(() => {
    if (error) return error;
    if (isLoading && chats.length === 0) return t("chats.states.loading");
    if (!isLoading && chats.length === 0) return t("chats.states.empty");
    return "";
  }, [chats.length, error, isLoading, t]);

  const closeSwipeOnOutside = (event) => {
    if (swipedChatId && !event.target.closest(".chat-card__wrapper")) {
      setSwipedChatId(null);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="chats-page" onClick={closeSwipeOnOutside}>
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
                  onDelete={handleDeleteChat}
                  onSwipeOpen={(id) => setSwipedChatId(id)}
                  onSwipeClose={() => setSwipedChatId(null)}
                  isSwiped={swipedChatId === chat.id}
                />
              ))}
        </div>

        {chatToDelete && (
          <div
            className="chat-delete-modal"
            role="dialog"
            aria-modal="true"
            onClick={() => setChatToDelete(null)}
          >
            <div
              className="chat-delete-modal__card"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="chat-delete-modal__title">
                {t("chats.actions.deleteChatConfirmTitle")}
              </p>
              <p className="chat-delete-modal__description">
                {t("chats.actions.deleteChatConfirmDescription")}
              </p>
              <div className="chat-delete-modal__actions">
                <button
                  type="button"
                  onClick={() => setChatToDelete(null)}
                >
                  {t("chats.thread.cancel")}
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={async () => {
                    try {
                      await deleteChatById(chatToDelete.id);
                      setChats((prev) => prev.filter((c) => c.id !== chatToDelete.id));
                    } catch (err) {
                      console.error("Failed to delete chat", err);
                      setError(t("chats.states.error"));
                    } finally {
                      setChatToDelete(null);
                      setSwipedChatId(null);
                    }
                  }}
                >
                  {t("chats.actions.deleteChat")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
