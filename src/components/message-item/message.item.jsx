import Wrapper from "./message.item.style";
import TailinIcon from "../icons/tailin.icon";
import TicksIcon from "../icons/ticks.icon";
import moment from "moment";
import { socket } from "../../services/socket.service";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";
import { toMarkdownWithLinks } from "../../utils/linkify";

const formatSenderName = (msg) => {
  const rawSender =
    msg?._data?.sender?.pushname ||
    msg?._data?.sender?.name ||
    msg?.notifyName ||
    msg?._data?.notifyName ||
    msg?.author ||
    msg?._data?.author ||
    msg?.from;

  if (!rawSender) return "";

  const normalized = String(rawSender).trim();
  if (!normalized) return "";

  if (!normalized.includes("@")) {
    return normalized;
  }

  const jidUser = normalized.split("@")[0];
  const digits = jidUser.replace(/[^\d]/g, "");
  if (digits.length >= 7) {
    return `+${digits}`;
  }

  return jidUser;
};

const getQuotedPreview = (quotedMessage) => {
  if (!quotedMessage) return "";
  if (quotedMessage.body && String(quotedMessage.body).trim()) {
    return String(quotedMessage.body).trim();
  }
  if (quotedMessage.hasMedia) {
    switch (quotedMessage.type) {
      case "image":
        return "Photo";
      case "video":
        return "Video";
      case "audio":
      case "ptt":
        return "Audio";
      case "document":
        return "Document";
      case "sticker":
        return "Sticker";
      default:
        return "Media";
    }
  }
  return "";
};

const MessageItem = ({ msg, chat }) => {
  const [mediaUrl, setMediaUrl] = useState(msg.mediaUrl);
  const [mediaFailed, setMediaFailed] = useState(false);
  const classes = ["message-conatainer", msg.fromMe ? "me" : ""];
  const time = moment((msg.timestamp || 0) * 1000).format("HH:mm");
  const messageSerializedId = msg?.id?._serialized || msg?.id?.id || msg?.id;
  const senderName = formatSenderName(msg);
  const showSender = Boolean(chat?.isGroup && !msg.fromMe && senderName);
  const quotedSenderName = formatSenderName(msg.quotedMessage);
  const quotedPreview = getQuotedPreview(msg.quotedMessage);

  useEffect(() => {
    if (!msg.hasMedia || !messageSerializedId) return;

    const handleMediaReady = (data) => {
      if (data.messageId === messageSerializedId) {
        setMediaUrl(data.mediaUrl);
      }
    };

    const handleMediaError = (data) => {
      if (data.messageId === messageSerializedId) {
        setMediaFailed(true);
      }
    };

    socket.on("media-ready", handleMediaReady);
    socket.on("media-error", handleMediaError);
    return () => {
      socket.off("media-ready", handleMediaReady);
      socket.off("media-error", handleMediaError);
    };
  }, [msg.hasMedia, messageSerializedId]);

  return (
    <Wrapper>
      <div className={classes.join(" ")}>
        <span className="tail-in">
          <TailinIcon me={msg.fromMe} />
        </span>
        <div className="inner">
          <div className={`message ${msg.hasMedia ? "has-media" : ""}`}>
            {showSender && <div className="sender">{senderName}</div>}
            {msg.quotedMessage && (
              <div className={`quoted-message ${msg.fromMe ? "me" : ""}`}>
                <div className="quoted-author">
                  {msg.quotedMessage.fromMe ? "You" : quotedSenderName || "Reply"}
                </div>
                {quotedPreview && <div className="quoted-text">{quotedPreview}</div>}
              </div>
            )}
            {msg.hasMedia && (
              <div className="media">
                {!mediaUrl && !mediaFailed && (
                  <div className="media-placeholder">טוען מדיה...</div>
                )}
                {!mediaUrl && mediaFailed && (
                  <div className="media-placeholder media-failed">לא ניתן לטעון את המדיה כרגע. נסה לפתוח את הצ'אט מחדש.</div>
                )}
                {msg.type === "image" && mediaUrl && <img src={mediaUrl} alt="Media" />}
                {msg.type === "video" && mediaUrl && (
                  <video controls>
                    <source src={mediaUrl} />
                    הדפדפן שלך לא תומך בניגון וידאו.
                  </video>
                )}
                {msg.type === "audio" && mediaUrl && (
                  <audio controls>
                    <source src={mediaUrl} />
                    הדפדפן שלך לא תומך בניגון אודיו.
                  </audio>
                )}
                {msg.type === "sticker" && mediaUrl && (
                  <img src={mediaUrl} alt="Sticker" style={{ width: 120, height: 120 }} />
                )}
                {msg.type === "document" && mediaUrl && msg.mimetype === "application/pdf" && (
                  <object data={mediaUrl} type="application/pdf" width="100%" height="400px">
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                      צפייה ב-PDF
                    </a>
                  </object>
                )}
                {msg.type === "document" && mediaUrl && msg.mimetype !== "application/pdf" && (
                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                    הורדת קובץ {msg.filename}
                  </a>
                )}
                {mediaUrl && ["image", "video", "audio", "sticker", "document"].indexOf(msg.type) === -1 && (
                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                    הורדה/צפייה בקובץ
                  </a>
                )}
              </div>
            )}
            <div className="text">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, children, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {toMarkdownWithLinks(msg.body || "")}
              </ReactMarkdown>
            </div>
            <div className="meta">
              <div className="time">{time}</div>
              {msg.fromMe && (
                <div className="ticks" aria-hidden>
                  <TicksIcon />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default MessageItem;

