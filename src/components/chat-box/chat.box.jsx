import React, { useEffect, useMemo, useRef, useState } from "react";
import Wrapper from "./chat.box.style";
import MicIcon from "../icons/mic.icon";
import EmojiIcon from "../icons/emoji.icon";
import AttachmentIcon from "../icons/attachment.icon";
import SendIcon from "../icons/send.icon";
import CrossIcon from "../icons/cross.icon";
import StickerIcon from "../icons/sticker.icon";
import GifIcon from "../icons/gif.icon";
import SearchIcon from "../icons/search.icon";
import MoreIcon from "../icons/more.icon";
import Avatar from "../avatar/avatar";
import AnimatedLoader from "../animated-loader/animated.loader";
import ChatboxMenu from "../menus/chatbox.menu";
import MessageItem from "../message-item/message.item";
import { useAppContext } from "../../context/appContext";
import {
  CHAT_MARKED_AS_READ,
  CHAT_UNREAD_COUNT_UPDATED,
} from "../../context/actions";
import { fetchChat, fetchMessages, markChatAsRead } from "../../services/api.service";
import { socket } from "../../services/socket.service";
import moment from "moment";
import { getChatDisplayName, getChatSerializedId } from "../../utils/chat";

const PlateType = {
  none: 0,
  emoji: 1,
  gif: 2,
  sticker: 3,
};

const getMessageMoment = (message) => moment((message?.timestamp || 0) * 1000);

const getDayDividerLabel = (message) => {
  const date = getMessageMoment(message);
  if (date.isSame(moment(), "day")) return "היום";
  if (date.isSame(moment().subtract(1, "day"), "day")) return "אתמול";
  return date.format("DD/MM/YYYY");
};

const initialState = {
  moreMenuAnchor: null,
  loading: true,
  plate: PlateType.none,
  messages: [],
};

const ChatBox = () => {
  const { chat, dispatch, showChatSearch } = useAppContext();
  const [state, setState] = useState(initialState);
  const [unreadAnchorId, setUnreadAnchorId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [floatingDayLabel, setFloatingDayLabel] = useState("");
  const messageListRef = useRef(null);
  const unreadMarkerRef = useRef(null);
  const textareaRef = useRef(null);
  const activeChatIdRef = useRef(null);
  const markReadInFlightRef = useRef(false);
  const initialUnreadScrollDoneRef = useRef(false);
  const userInteractedRef = useRef(false);

  const date = useMemo(() => moment(chat?.date).format("DD/MM/YYYY"), [chat?.date]);

  const extractMessageId = (message) =>
    (message && message.id && (message.id._serialized || message.id.id)) ||
    message?.id;

  const getUnreadCount = (currentChat) =>
    currentChat?.unreadCount ?? currentChat?.unread ?? 0;

  const getChatIdFromMessage = (message) =>
    message?.fromMe ? message?.to : message?.from;

  const chatId = getChatSerializedId(chat);
  const title = getChatDisplayName(chat);
  const currentUnreadCount = getUnreadCount(chat);

  const syncUnreadCountFromServer = (nextCount) => {
    if (!activeChatIdRef.current) return;
    dispatch({
      type: CHAT_UNREAD_COUNT_UPDATED,
      payload: { chatId: activeChatIdRef.current, unreadCount: Math.max(0, nextCount) },
    });
  };

  const isNearBottom = () => {
    const container = messageListRef.current;
    if (!container) return false;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= 32;
  };

  const refreshActiveChatUnread = async (activeChatId) => {
    const chatRes = await fetchChat(activeChatId);
    const nextUnreadCount = getUnreadCount(chatRes?.data);
    syncUnreadCountFromServer(nextUnreadCount);
    return nextUnreadCount;
  };

  const markWholeChatAsRead = () => {
    const activeChatId = activeChatIdRef.current;
    if (!activeChatId || markReadInFlightRef.current) return;

    markReadInFlightRef.current = true;
    markChatAsRead(activeChatId)
      .then(async () => {
        const nextUnreadCount = await refreshActiveChatUnread(activeChatId);
        if (nextUnreadCount <= 0) {
          setUnreadAnchorId(null);
          dispatch({
            type: CHAT_MARKED_AS_READ,
            payload: { chatId: activeChatId },
          });
        }
      })
      .catch((err) => {
        console.error("failed to mark chat as read:", err?.message || err);
      })
      .finally(() => {
        markReadInFlightRef.current = false;
      });
  };

  const tryMarkVisibleChatAsRead = () => {
    if (!userInteractedRef.current) return;
    if (currentUnreadCount <= 0) return;
    if (!isNearBottom()) return;
    markWholeChatAsRead();
  };

  const hidePlate = () => {
    setState((prev) => ({ ...prev, plate: PlateType.none }));
  };

  const emojiPlate = () => {
    setState((prev) => ({ ...prev, plate: PlateType.emoji }));
  };

  const setMoreMenuAnchor = (event) => {
    setState((prev) => ({ ...prev, moreMenuAnchor: event.currentTarget }));
  };

  const releaseMoreMenuAnchor = (command) => {
    if (command) {
      command.payload = command.payload || {};
      dispatch(command);
    }
    setState((prev) => ({ ...prev, moreMenuAnchor: null }));
  };

  useEffect(() => {
    activeChatIdRef.current = chatId;
    markReadInFlightRef.current = false;
    initialUnreadScrollDoneRef.current = false;
    userInteractedRef.current = false;
    setUnreadAnchorId(null);

    setState((prev) => ({ ...prev, loading: true, messages: [] }));

    Promise.all([fetchChat(chatId), fetchMessages(chatId)]).then(
      ([chatRes, messagesRes]) => {
        if (activeChatIdRef.current !== chatId) return;

        const freshChat = chatRes?.data || {};
        const sortedMessages = [...(messagesRes?.data || [])].sort(
          (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
        );

        const unreadCount = getUnreadCount(freshChat);
        const unreadStartIndex = Math.max(sortedMessages.length - unreadCount, 0);
        const candidateUnreadIds = sortedMessages
          .slice(unreadStartIndex)
          .map((message) => extractMessageId(message))
          .filter(Boolean);

        setUnreadAnchorId(candidateUnreadIds[0] || null);
        syncUnreadCountFromServer(unreadCount);

        setState((prev) => ({
          ...prev,
          messages: sortedMessages,
          loading: false,
        }));
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;

    const updateFloatingDay = () => {
      const dayDividers = container.querySelectorAll("[data-day-label]");
      if (!dayDividers.length) {
        setFloatingDayLabel("");
        return;
      }

      const currentTop = container.scrollTop + 24;
      let nextLabel = dayDividers[0].getAttribute("data-day-label") || "";

      dayDividers.forEach((divider) => {
        if (divider.offsetTop <= currentTop) {
          nextLabel = divider.getAttribute("data-day-label") || nextLabel;
        }
      });

      setFloatingDayLabel(nextLabel);
    };

    updateFloatingDay();
    container.addEventListener("scroll", updateFloatingDay, { passive: true });
    return () => {
      container.removeEventListener("scroll", updateFloatingDay);
    };
  }, [state.messages]);

  useEffect(() => {
    if (unreadAnchorId && unreadMarkerRef.current) {
      if (initialUnreadScrollDoneRef.current) return;

      initialUnreadScrollDoneRef.current = true;
      unreadMarkerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [unreadAnchorId, state.messages]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;

    const onUserIntent = () => {
      userInteractedRef.current = true;
    };

    const onScroll = () => {
      tryMarkVisibleChatAsRead();
    };

    container.addEventListener("wheel", onUserIntent, { passive: true });
    container.addEventListener("touchstart", onUserIntent, { passive: true });
    container.addEventListener("mousedown", onUserIntent);
    container.addEventListener("keydown", onUserIntent);
    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("wheel", onUserIntent);
      container.removeEventListener("touchstart", onUserIntent);
      container.removeEventListener("mousedown", onUserIntent);
      container.removeEventListener("keydown", onUserIntent);
      container.removeEventListener("scroll", onScroll);
    };
  });

  useEffect(() => {
    const handleIncomingMessage = (payload) => {
      const message = payload?.msg || payload?.message || payload;
      if (!message) return;

      const incomingChatId = getChatIdFromMessage(message);
      if (incomingChatId === "status@broadcast") return;
      if (!incomingChatId || incomingChatId !== chatId) return;

      setState((prev) => {
        const alreadyExists = prev.messages.some(
          (m) => extractMessageId(m) === extractMessageId(message)
        );

        if (alreadyExists) return prev;

        const updated = [...prev.messages, message].sort(
          (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
        );

        return { ...prev, messages: updated };
      });
    };

    socket.on("message", handleIncomingMessage);
    return () => {
      socket.off("message", handleIncomingMessage);
    };
  }, [chatId]);

  useEffect(() => {
    tryMarkVisibleChatAsRead();
  }, [currentUnreadCount, state.messages.length]);

  const handleInputChange = (e) => {
    const el = e.target;
    setInputText(el.value);
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSend = () => {
    if (!inputText.trim()) {
      return;
    }

    console.log("send message:", inputText);
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Wrapper className="chatbox-container">
      <div className="message-bg"></div>
      <header>
        <div className="info-wrapper">
          <div className="avatar">
            <Avatar chat={chat} />
          </div>
          <div className="info">
            <div className="title">{title}</div>
            <div className="date">{date}</div>
          </div>
        </div>
        <div className="actions">
          <button
            onClick={showChatSearch}
            disabled={state.loading}
            className="action action-holder"
          >
            <SearchIcon />
          </button>
          <button
            onClick={setMoreMenuAnchor}
            disabled={state.loading}
            className="action action-holder"
          >
            <MoreIcon />
          </button>
        </div>
      </header>
      <ChatboxMenu
        anchorEl={state.moreMenuAnchor}
        release={releaseMoreMenuAnchor}
      />
      <main ref={messageListRef} className={state.loading ? "loading" : ""}>
        {floatingDayLabel && (
          <div className="floating-day-indicator">
            <span>{floatingDayLabel}</span>
          </div>
        )}
        {state.loading ? (
          <div className="loader-wrapper">
            <AnimatedLoader />
          </div>
        ) : (
          state.messages.map((msg, index) => {
            const messageId = extractMessageId(msg) || `msg-${index}`;
            const isUnreadAnchor =
              unreadAnchorId && messageId === unreadAnchorId;
            const previousMessage = index > 0 ? state.messages[index - 1] : null;
            const showDayDivider =
              !previousMessage ||
              !getMessageMoment(previousMessage).isSame(
                getMessageMoment(msg),
                "day"
              );

            return (
              <div
                key={messageId}
                data-message-id={messageId}
              >
                {showDayDivider && (
                  <div className="day-divider" data-day-label={getDayDividerLabel(msg)}>
                    <span>{getDayDividerLabel(msg)}</span>
                  </div>
                )}
                {unreadAnchorId && isUnreadAnchor && (
                  <div className="unread-divider" ref={unreadMarkerRef}>
                    <span>הודעות שלא נקראו</span>
                  </div>
                )}
                <MessageItem msg={msg} chat={chat} />
              </div>
            );
          })
        )}
      </main>
      <footer className={state.plate ? "has-plate" : ""}>
        <div className="footer-plate"></div>
        <div className="footer-inner">
          <div className="actions">
            {state.plate > 0 && (
              <button onClick={hidePlate} className="action action-holder">
                <CrossIcon />
              </button>
            )}
            <button
              disabled={state.loading}
              onClick={emojiPlate}
              className="action action-holder"
            >
              <EmojiIcon />
            </button>
            {state.plate > 0 && (
              <>
                <button className="action action-holder">
                  <GifIcon />
                </button>
                <button className="action action-holder">
                  <StickerIcon />
                </button>
              </>
            )}
            <button disabled={state.loading} className="action action-holder">
              <AttachmentIcon />
            </button>
          </div>
          <div className="send-wrapper">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                disabled={state.loading}
                rows="1"
                placeholder="Type a message"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              ></textarea>
            </div>
            <button
              disabled={state.loading}
              onClick={handleSend}
              className={`send-action action-holder ${
                inputText.trim() ? "has-text" : ""
              }`}
            >
              {inputText.trim() ? <SendIcon /> : <MicIcon />}
            </button>
          </div>
        </div>
      </footer>
    </Wrapper>
  );
};

export default ChatBox;

