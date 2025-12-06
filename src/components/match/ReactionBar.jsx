import {
  PiChatCircleTextBold,
  PiFlagBold,
  PiHeartBold,
  PiXBold,
} from "react-icons/pi";
import "./ReactionBar.css";

export default function ReactionBar({
  onSkip,
  onMessage,
  onReport,
  onLike,
  disabled,
  skipLabel,
  messageLabel,
  reportLabel,
  likeLabel,
  showMessageButton = true,
}) {
  const makeHandler = (fn) => () => {
    if (!disabled) {
      fn?.();
    }
  };

  const buttons = [
    {
      key: "skip",
      className: "reaction-button is-skip",
      onClick: onSkip,
      label: skipLabel,
      icon: <PiXBold aria-hidden />,
    },
    showMessageButton
      ? {
          key: "message",
          className: "reaction-button is-message",
          onClick: onMessage,
          label: messageLabel,
          icon: <PiChatCircleTextBold aria-hidden />,
        }
      : null,
    {
      key: "report",
      className: "reaction-button is-report",
      onClick: onReport,
      label: reportLabel,
      icon: <PiFlagBold aria-hidden />,
    },
    {
      key: "like",
      className: "reaction-button is-like",
      onClick: onLike,
      label: likeLabel,
      icon: <PiHeartBold aria-hidden />,
    },
  ].filter(Boolean);

  return (
    <div
      className={`reaction-bar ${
        buttons.length === 3 ? "reaction-bar--compact" : ""
      }`}
      aria-label="Reactions"
    >
      {buttons.map((btn) => (
        <button
          key={btn.key}
          type="button"
          className={btn.className}
          onClick={makeHandler(btn.onClick)}
          disabled={disabled}
          aria-label={btn.label}
          title={btn.label}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}
