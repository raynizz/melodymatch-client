import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as signalR from "@microsoft/signalr";
import Layout from "../../layout/layout/Layout";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { fetchChatById, fetchChatMessages } from "../../api/chatService";
import { ChatMessageDto } from "../../dto/chat/ChatSummaryDto";
import { getAccessToken } from "../../utils/token";
import { resolveAssetUrl } from "../../utils/url";
import { API_HOST } from "../../api/constants";
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
  const { isAuthenticated, identityUserId, currentMelodyUser } = useAuth();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [companionOnline, setCompanionOnline] = useState(false);

  const connectionRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const melodyMatchUserId = currentMelodyUser?.id;

  const companion = useMemo(() => {
    if (!chat) return null;
    return chat.findCompanion(identityUserId);
  }, [chat, identityUserId]);

  const companionDisplayName = companion?.displayName || t("chats.labels.fallbackName");
  const companionAvatar = resolveAssetUrl(companion?.avatarUrl);

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
      if (message.chatId !== chatId) return;
      
      const messageDto = new ChatMessageDto(message);
      
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.id.startsWith("temp-"));
        if (filtered.some((msg) => msg.id === messageDto.id)) {
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
      if (payloadChatId !== chatId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
        )
      );
    });

    connection.on("UserTyping", ({ chatId: payloadChatId, userId }) => {
      if (payloadChatId !== chatId || userId === identityUserId) return;
      setTypingUsers((prev) => new Set([...prev, userId]));
    });

    connection.on("UserStoppedTyping", ({ chatId: payloadChatId, userId }) => {
      if (payloadChatId !== chatId) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    connection.on("UserOnline", ({ userId }) => {
      if (companion && userId === companion.id) {
        setCompanionOnline(true);
      }
    });

    connection.on("UserOffline", ({ userId }) => {
      if (companion && userId === companion.id) {
        setCompanionOnline(false);
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
  }, [chatId, hydrateMessages, identityUserId, isAuthenticated, scrollToBottom, t]);

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
              </div>
              <div>
                <p className="chat-thread__title">{companionDisplayName}</p>
                <p className="chat-thread__subtitle">
                  {companionOnline ? t("chats.thread.online") : t("chats.thread.offline")}
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
                >
                  <div className="message-text">{msg.content}</div>
                  <div className="message-meta">
                    <span className="message-time">{formatTime(msg.creationTime)}</span>
                    {isMine && (
                      <span className="read-receipt" title={msg.isRead ? "Прочитано" : "Надіслано"}>
                        {msg.isRead ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {typingUsers.size > 0 && (
            <div className="typing-indicator">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

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
