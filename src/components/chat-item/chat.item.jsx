import React, { useMemo } from "react";
import moment from "moment";
import Wrapper from "./chat.item.style";
import Avatar from "../avatar/avatar";
import TicksIcon from "../icons/ticks.icon";
import { getChatDisplayName } from "../../utils/chat";

const ChatItem = ({ chat, current, onPick }) => {
  const date = useMemo(() => {
    const date = new Date((chat.timestamp || 0) * 1000);
    const withinWeek = moment().diff(date, "days") < 7;
    const format = withinWeek ? "dddd" : "DD/MM/YYYY";
    return moment(date).format(format);
  }, [chat.timestamp]);

  const title = getChatDisplayName(chat);
  const unreadCount = chat.unreadCount ?? chat.unread ?? 0;
  const showOutgoingTicks = Boolean(chat?.lastMessage?.fromMe);

  return (
    <Wrapper
      onClick={onPick}
      className={`chat-item-wrapper ${current ? "current" : ""}`}
    >
      <div className="avatar">
        <Avatar chat={chat} />
      </div>
      <div className="inner">
        <div className="info">
          <div className="title">{title}</div>
          <div className="date">{date}</div>
        </div>
        <div className="more">
          {chat.lastMessage ? (
            <div className="last-message">
              <div className="mode"></div>
              <div className="text">
                {showOutgoingTicks && <TicksIcon />}
                <span>{chat.lastMessage.text}</span>
              </div>
            </div>
          ) : (
            <div className="gap"></div>
          )}

          {unreadCount > 0 && (
            <div className="unread">
              <div className="badge">
                <span>{unreadCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default ChatItem;

