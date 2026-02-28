import Wrapper from "./message.item.style";
import TailinIcon from "../icons/tailin.icon";
import TicksIcon from "../icons/ticks.icon";
import moment from "moment";
import { socket } from "../../services/socket.service";
import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";

const MessageItem = ({ msg, chat }) => {
  const [mediaUrl, setMediaUrl] = useState(msg.mediaUrl);
  const classes = ["message-conatainer", msg.fromMe ? "me" : ""];
  const time = moment((msg.timestamp || 0) * 1000).format("HH:mm");
  const messageSerializedId = msg?.id?._serialized || msg?.id?.id || msg?.id;
  const showSender = Boolean(chat?.isGroup && !msg.fromMe);

  useEffect(() => {
    if (!msg.hasMedia || !messageSerializedId) return;

    const handleMediaReady = (data) => {
      if (data.messageId === messageSerializedId) {
        setMediaUrl(data.mediaUrl);
      }
    };

    socket.on("media-ready", handleMediaReady);
    return () => {
      socket.off("media-ready", handleMediaReady);
    };
  }, [msg.hasMedia, messageSerializedId]);

  return (
    <Wrapper>
      <div className={classes.join(" ")}>
        <span className="tail-in">
          <TailinIcon me={msg.fromMe} />
        </span>
        <div className="inner">
          <div className="message">
            {showSender && <div className="sender">{msg.from}</div>}
            {msg.hasMedia && (
              <div className="media">
                {!mediaUrl && (
                  <div className="media-placeholder">טוען מדיה...</div>
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
              <ReactMarkdown>{msg.body}</ReactMarkdown>
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

