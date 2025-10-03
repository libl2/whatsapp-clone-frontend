import Wrapper from "./message.item.style";
import TailinIcon from "../icons/tailin.icon";
import moment from "moment";
import { socket } from "../../services/socket.service";
import { useState, useEffect } from "react";

const MessageItem = ({ msg, chat }) => {
  const [mediaUrl, setMediaUrl] = useState(msg.mediaUrl);
  const classes = ["message-conatainer", msg.fromMe ? "me" : ""];
  const time = moment(msg.timestamp * 1000).format("HH:mm");

  useEffect(() => {
    if (msg.hasMedia) {
      // האזנה לאירוע media-ready
      const handleMediaReady = (data) => {
        if (data.messageId === msg.id._serialized) {
          setMediaUrl(data.mediaUrl);
        }
      };

      socket.on('media-ready', handleMediaReady);

      // ניקוי המאזין כשהקומפוננטה מתפרקת
      return () => {
        socket.off('media-ready', handleMediaReady);
      };
    }
  }, [msg.id._serialized]);
  
  if (msg.hasMedia) {
    console.log('Media URL:', msg.mediaUrl);
    console.log('Message type:', msg.type);
  }

  return (
    <Wrapper>
      <div className={classes.join(" ")}>
        <span className="tail-in">
          <TailinIcon me={msg.fromMe} />
        </span>
        <div className="inner">
          <div className="sender">{msg.from}</div>
          <div className="message">
            <div className="text">{msg.body}</div>
            {msg.hasMedia && (
              <div className="media">
                {msg.type === "image" && mediaUrl && <img src={mediaUrl} alt="Media" />}
                {msg.type === "video" && mediaUrl && <video src={mediaUrl} controls />}
              </div>
            )}
            <div className="time">{time}</div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default MessageItem;