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
}) {
  const makeHandler = (fn) => () => {
    if (!disabled) {
      fn?.();
    }
  };

  return (
    <div className="reaction-bar" aria-label="Reactions">
      <button
        type="button"
        className="reaction-button is-skip"
        onClick={makeHandler(onSkip)}
        disabled={disabled}
        aria-label={skipLabel}
        title={skipLabel}
      >
        <PiXBold aria-hidden />
      </button>
      <button
        type="button"
        className="reaction-button is-message"
        onClick={makeHandler(onMessage)}
        disabled={disabled}
        aria-label={messageLabel}
        title={messageLabel}
      >
        <PiChatCircleTextBold aria-hidden />
      </button>
      <button
        type="button"
        className="reaction-button is-report"
        onClick={makeHandler(onReport)}
        disabled={disabled}
        aria-label={reportLabel}
        title={reportLabel}
      >
        <PiFlagBold aria-hidden />
      </button>
      <button
        type="button"
        className="reaction-button is-like"
        onClick={makeHandler(onLike)}
        disabled={disabled}
        aria-label={likeLabel}
        title={likeLabel}
      >
        <PiHeartBold aria-hidden />
      </button>
    </div>
  );
}
