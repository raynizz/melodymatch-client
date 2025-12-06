import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as signalR from "@microsoft/signalr";
import { PiCheckBold, PiChecksBold } from "react-icons/pi";
import Layout from "../../layout/layout/Layout";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { fetchChatById, fetchChatMessages } from "../../api/chatService";
import { ChatMessageDto } from "../../dto/chat/ChatSummaryDto";
import { getAccessToken } from "../../utils/token";
import { resolveAssetUrl } from "../../utils/url";
import { API_HOST } from "../../api/constants";
import { Roles } from "../../types/roles";
import "./ChatThreadPage.css";

const hubUrl = `${API_HOST.replace(/\/$/, "")}/hubs/chat`;

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatThreadPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, identityUserId, currentMelodyUser, hasRole } =
    useAuth();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [companionOnline, setCompanionOnline] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [optionsMessage, setOptionsMessage] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const connectionRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const companionIdRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const chatIdKey = useMemo(() => chatId?.toString() ?? "", [chatId]);
  const extractChatId = useCallback((payload) => {
    const raw =
      payload?.chatId ??
      payload?.ChatId ??
      payload?.chat?.id ??
      payload?.Chat?.Id ??
      null;
    return raw === null || typeof raw === "undefined" ? "" : raw.toString();
  }, []);

  const melodyMatchUserId = currentMelodyUser?.id;

  const companion = useMemo(() => {
    if (!chat) return null;
    return chat.findCompanion(identityUserId);
  }, [chat, identityUserId]);

  const companionDisplayName = companion?.displayName || t("chats.labels.fallbackName");
  const companionAvatar = resolveAssetUrl(companion?.avatarUrl);

  useEffect(() => {
    companionIdRef.current = companion?.id ?? null;
    setCompanionOnline(Boolean(companion?.isOnline));
  }, [companion]);

  const isCompanionTyping = typingUsers.size > 0;
  const companionIdValue = useMemo(
    () => (companionIdRef.current ?? "").toString(),
    [companion]
  );

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    });
  }, []);

  const markMessagesAsRead = useCallback(
    async (ids) => {
      if (!ids?.length || !connectionRef.current) return;
      try {
        await connectionRef.current.invoke("MarkMessagesAsRead", chatId, ids);
      } catch (err) {
        console.warn("Failed to mark as read", err);
      }
    },
    [chatId]
  );

  const hydrateMessages = useCallback(
    async (connection) => {
      setIsLoading(true);
      setError("");
      try {
        const [chatData, history] = await Promise.all([
          fetchChatById(chatId),
          fetchChatMessages(chatId),
        ]);
        setChat(chatData);
        setMessages(history);
        const unreadFromCompanion = history
          .filter(
            (msg) => msg.senderId !== melodyMatchUserId && !msg.isRead
          )
          .map((msg) => msg.id);
        if (unreadFromCompanion.length && connection) {
          await markMessagesAsRead(unreadFromCompanion);
        }
        setTimeout(() => scrollToBottom(), 100);
      } catch (err) {
        console.error("Failed to load chat", err);
        setError(t("chats.thread.error"));
      } finally {
        setIsLoading(false);
      }
    },
    [chatId, melodyMatchUserId, markMessagesAsRead, scrollToBottom, t]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getAccessToken();
    if (!token) {
      setError(t("chats.thread.error"));
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => {
          const currentToken = getAccessToken();
          return currentToken || "";
        },
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          if (ctx.previousRetryCount === 0) return 0;
          if (ctx.previousRetryCount < 3) return 2000;
          if (ctx.previousRetryCount < 7) return 10000;
          return 30000;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    hydrateMessages(null);

    connection.on("ReceiveMessage", (message) => {
      const payloadChatId = extractChatId(message);
      if (payloadChatId !== chatIdKey) return;
      
      const messageDto = new ChatMessageDto(message);
      
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !String(msg.id).startsWith("temp-"));
        if (messageDto.id && filtered.some((msg) => msg.id === messageDto.id)) {
          return filtered;
        }
        return [...filtered, messageDto];
      });
      
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          
          if (messageDto.senderId === melodyMatchUserId || isNearBottom) {
            scrollToBottom();
          }
        }
      }, 50);
      
      if (messageDto.senderId !== melodyMatchUserId) {
        markMessagesAsRead([messageDto.id]);
      }
    });

    connection.on("MessagesRead", ({ chatId: payloadChatId, messageIds }) => {
      if ((payloadChatId ?? "").toString() !== chatIdKey) return;
      const readIds = new Set((messageIds ?? []).map((id) => id?.toString?.() ?? id));
      setMessages((prev) =>
        prev.map((msg) =>
          readIds.has(msg.id) ? { ...msg, isRead: true } : msg
        )
      );
    });

    connection.on("UserTyping", ({ chatId: payloadChatId, userId }) => {
      if ((payloadChatId ?? "").toString() !== chatIdKey || userId === identityUserId) return;
      setTypingUsers((prev) => new Set([...prev, userId]));
    });

    connection.on("UserStoppedTyping", ({ chatId: payloadChatId, userId }) => {
      if ((payloadChatId ?? "").toString() !== chatIdKey) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    const extractUserId = (payload) => {
      const value = payload?.userId ?? payload?.UserId ?? payload;
      return value === null || typeof value === "undefined" ? "" : value.toString();
    };

    connection.on("UserOnline", (payload) => {
      if (extractUserId(payload) === (companionIdRef.current ?? "").toString()) {
        setCompanionOnline(true);
      }
    });

    connection.on("UserOffline", (payload) => {
      if (extractUserId(payload) === (companionIdRef.current ?? "").toString()) {
        setCompanionOnline(false);
      }
    });

    connection.on("MessageUpdated", (message) => {
      const payloadChatId = extractChatId(message);
      if (!message || payloadChatId !== chatIdKey) return;
      const updated = new ChatMessageDto(message);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updated.id ? updated : msg))
      );
      if (updated.senderId !== melodyMatchUserId) {
        markMessagesAsRead([updated.id]);
      }
    });

    connection.on("MessageDeleted", (payload) => {
      const payloadChatId = extractChatId(payload);
      const messageId = payload?.messageId ?? payload?.id ?? payload?.MessageId;
      if (!messageId || payloadChatId !== chatIdKey) return;
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      if (editingMessageId === messageId) {
        cancelEditing();
      }
      if (deleteCandidate?.id === messageId) {
        setDeleteCandidate(null);
      }
      if (optionsMessage?.id === messageId) {
        setOptionsMessage(null);
      }
    });

    connection
      .start()
      .then(() => {
        setIsConnected(true);
        setError("");
        hydrateMessages(connection);
      })
      .catch((err) => {
        console.error("SignalR connection failed:", err);
        setError(t("chats.thread.error"));
        setIsConnected(false);
      });

    connection.onclose((error) => {
      setIsConnected(false);
    });
    
    connection.onreconnecting((error) => {
      setIsConnected(false);
    });
    
    connection.onreconnected((connectionId) => {
      setIsConnected(true);
      setError("");
    });

    return () => {
      connection.stop();
      setTypingUsers(new Set());
      connectionRef.current = null;
    };
  }, [chatIdKey, extractChatId, hydrateMessages, identityUserId, isAuthenticated, scrollToBottom, t]);

  useEffect(() => {
    if (!isConnected || !connectionRef.current || !chatIdKey) return;

    const connection = connectionRef.current;

    const join = async () => {
      try {
        await connection.invoke("JoinChat", chatIdKey);
      } catch (err) {
        console.warn("JoinChat failed or not supported", err);
      }
    };

    join();

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("LeaveChat", chatIdKey).catch(() => {});
      }
    };
  }, [chatIdKey, isConnected]);

  useEffect(() => {
    if (!isConnected || !connectionRef.current) return;
    const targetId = companionIdRef.current;
    if (!targetId) return;
    let active = true;

    const fetchStatus = async () => {
      try {
        const result = await connectionRef.current.invoke("IsUserOnline", targetId);
        if (active) setCompanionOnline(Boolean(result));
        return;
      } catch (err) {
        console.warn("IsUserOnline failed, falling back to GetOnlineUsers", err);
      }

      try {
        const onlineUsers = await connectionRef.current.invoke("GetOnlineUsers");
        if (!active) return;
        const ids = Array.isArray(onlineUsers)
          ? onlineUsers.map((id) => id?.toString?.() ?? id).filter(Boolean)
          : [];
        setCompanionOnline(ids.includes(targetId.toString()));
      } catch (err) {
        console.warn("GetOnlineUsers failed", err);
      }
    };

    fetchStatus();

    return () => {
      active = false;
    };
  }, [companionIdValue, isConnected]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    if (!connectionRef.current || !isConnected) return;

    connectionRef.current.invoke("UserTyping", chatId).catch(() => {});
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      connectionRef.current?.invoke("UserStoppedTyping", chatId).catch(() => {});
    }, 1000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !connectionRef.current || !isConnected) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      senderId: melodyMatchUserId,
      sender: { id: melodyMatchUserId },
      creationTime: new Date().toISOString(),
      isRead: false,
      chatId: chatId,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    
    setTimeout(() => scrollToBottom(), 50);

    try {
      await connectionRef.current.invoke("SendMessage", {
        chatId,
        content: trimmed,
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      connectionRef.current.invoke("UserStoppedTyping", chatId).catch(() => {});
    } catch (err) {
      console.error("Failed to send message", err);
      setError(t("chats.thread.sendError"));
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    }
  };

  const startEditing = (message) => {
    if (!message || message.senderId !== melodyMatchUserId) return;
    setEditingMessageId(message.id);
    setEditingText(message.content ?? "");
    setOptionsMessage(null);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const saveEditing = async (message) => {
    if (!message || message.id !== editingMessageId) return;
    const trimmed = editingText.trim();
    if (!trimmed || !connectionRef.current || !isConnected) return;
    try {
      await connectionRef.current.invoke("UpdateMessage", {
        id: message.id,
        chatId,
        content: trimmed,
        isRead: message.isRead,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, content: trimmed } : msg
        )
      );
      cancelEditing();
    } catch (err) {
      console.error("Failed to update message", err);
      setError(t("chats.thread.updateError"));
    }
  };

  const handleDeleteMessage = async (message) => {
    if (!message || message.senderId !== melodyMatchUserId) return;
    if (!connectionRef.current || !isConnected) return;
    try {
      await connectionRef.current.invoke("DeleteMessage", message.id, chatId);
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
      if (editingMessageId === message.id) {
        cancelEditing();
      }
      setDeleteCandidate(null);
    } catch (err) {
      console.error("Failed to delete message", err);
      setError(t("chats.thread.deleteError"));
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole?.(Roles.Dater)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="chat-thread">
        <header className="chat-thread__header">
          <div className="chat-thread__meta">
            <button 
              className="chat-thread__back-btn" 
              onClick={() => navigate("/chats")}
              aria-label={t("chats.thread.back")}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="chat-thread__profile">
              <div className="chat-thread__avatar" aria-hidden>
                {companionAvatar ? (
                  <img src={companionAvatar} alt={companionDisplayName} />
                ) : (
                  <span>{companionDisplayName[0] ?? "M"}</span>
                )}
                <span
                  className={`chat-thread__status-dot ${companionOnline ? "is-online" : ""}`}
                  title={companionOnline ? t("chats.thread.online") : t("chats.thread.offline")}
                />
                {isCompanionTyping && (
                  <span className="chat-thread__typing-dot" title={t("chats.thread.typing")}>•</span>
                )}
              </div>
              <div>
                <p className="chat-thread__title">{companionDisplayName}</p>
                <p className="chat-thread__subtitle">
                  {isCompanionTyping
                    ? t("chats.thread.typing")
                    : companionOnline
                      ? t("chats.thread.online")
                      : t("chats.thread.offline")}
                </p>
              </div>
            </div>
          </div>
        </header>

        {error && <div className="chat-thread__status-banner">{error}</div>}

        <div className="chat-thread__messages" ref={messagesContainerRef}>
          {isLoading ? (
            <p className="chat-thread__helper">{t("chats.thread.loading")}</p>
          ) : messages.length === 0 ? (
            <p className="chat-thread__helper">{t("chats.thread.empty")}</p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === melodyMatchUserId;
              
              return (
                <div
                  key={msg.id}
                  className={`message-bubble ${isMine ? "is-mine" : "is-theirs"}`}
                  onContextMenu={(e) => {
                    if (!isMine) return;
                    e.preventDefault();
                    setOptionsMessage(msg);
                  }}
                >
                  <div className="message-text">
                    <span>{msg.content}</span>
                  </div>
                  <div className="message-meta">
                    <span className="message-time">{formatTime(msg.creationTime)}</span>
                    {isMine && (
                      <span
                        className="read-receipt"
                        title={msg.isRead ? "Прочитано" : "Надіслано"}
                        aria-label={msg.isRead ? "Прочитано" : "Надіслано"}
                      >
                        {msg.isRead ? <PiChecksBold aria-hidden /> : <PiCheckBold aria-hidden />}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {optionsMessage && (
          <div
            className="message-modal"
            role="dialog"
            aria-modal="true"
            onClick={() => setOptionsMessage(null)}
          >
            <div
              className="message-modal__dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="message-modal__title">{t("chats.thread.messageActions")}</p>
              <p className="message-modal__preview">{optionsMessage.content}</p>
              <div className="message-modal__actions">
                <button type="button" onClick={() => startEditing(optionsMessage)}>
                  {t("chats.thread.edit")}
                </button>
                <button type="button" onClick={() => setDeleteCandidate(optionsMessage)}>
                  {t("chats.thread.delete")}
                </button>
                <button type="button" onClick={() => setOptionsMessage(null)}>
                  {t("chats.thread.cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteCandidate && (
          <div
            className="message-modal"
            role="dialog"
            aria-modal="true"
            onClick={() => setDeleteCandidate(null)}
          >
            <div
              className="message-modal__dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="message-modal__title">{t("chats.thread.deleteConfirm")}</p>
              <p className="message-modal__preview">{deleteCandidate.content}</p>
              <div className="message-modal__actions">
                <button type="button" onClick={() => setDeleteCandidate(null)}>
                  {t("chats.thread.cancel")}
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    handleDeleteMessage(deleteCandidate);
                    setOptionsMessage(null);
                  }}
                >
                  {t("chats.thread.delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {editingMessageId && (
          <div
            className="message-modal"
            role="dialog"
            aria-modal="true"
            onClick={cancelEditing}
          >
            <div
              className="message-modal__dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="message-modal__title">{t("chats.thread.editMessage")}</p>
              <label className="message-modal__field">
                <span>{t("chats.thread.placeholder")}</span>
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  rows={3}
                  autoFocus
                />
              </label>
              <div className="message-modal__actions">
                <button type="button" onClick={cancelEditing}>
                  {t("chats.thread.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    saveEditing(messages.find((m) => m.id === editingMessageId))
                  }
                  disabled={!editingText.trim()}
                >
                  {t("chats.thread.save")}
                </button>
              </div>
            </div>
          </div>
        )}

        <form className="chat-thread__composer" onSubmit={handleSend}>
          <input
            type="text"
            placeholder={t("chats.thread.placeholder")}
            value={newMessage}
            onChange={handleInputChange}
            disabled={!isConnected}
          />
          <Button
            type="submit"
            size="md"
            disabled={!isConnected || !newMessage.trim()}
          >
            {t("chats.thread.send")}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
