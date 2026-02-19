import React, { useEffect, useState, useRef } from "react";
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
import { CHAT_MARKED_AS_READ } from "../../context/actions";
import { fetchMessages, markChatAsRead } from "../../services/api.service";
import { socket } from "../../services/socket.service";
import moment from "moment";

const PlateType = {
  none: 0,
  emoji: 1,
  gif: 2,
  sticker: 3,
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
  const messageListRef = useRef(null);
  const unreadMarkerRef = useRef(null);
  const textareaRef = useRef(null);
  const initialUnreadRef = useRef(0);
  const activeChatIdRef = useRef(null);
  const markReadInFlightRef = useRef(false);
  const userInteractedRef = useRef(false);
  const date = moment(chat.date).format("DD/MM/YYYY");

  const extractMessageId = (message) =>
    (message && message.id && (message.id._serialized || message.id.id)) ||
    message?.id;

  const getUnreadCount = (currentChat) =>
    currentChat?.unreadCount ?? currentChat?.unread ?? 0;

  const getChatIdFromMessage = (message) =>
    message?.fromMe ? message?.to : message?.from;

  const getCurrentChatId = (currentChat) =>
    currentChat?.id?._serialized || currentChat?.id?.id || currentChat?.id;

  const chatId = getCurrentChatId(chat);

  const isNearBottom = () => {
    const list = messageListRef.current;
    if (!list) return false;
    const threshold = 24;
    return list.scrollHeight - list.scrollTop - list.clientHeight <= threshold;
  };

  const markCurrentChatReadIfNeeded = () => {
    const chatId = activeChatIdRef.current;

    if (!chatId) return;
    if (initialUnreadRef.current <= 0) return;
    if (!userInteractedRef.current) return;
    if (markReadInFlightRef.current) return;
    if (!isNearBottom()) return;

    markReadInFlightRef.current = true;
    markChatAsRead(chatId)
      .then(() => {
        initialUnreadRef.current = 0;
        setUnreadAnchorId(null);
        dispatch({
          type: CHAT_MARKED_AS_READ,
          payload: { chatId },
        });
      })
      .catch((err) => {
        markReadInFlightRef.current = false;
        console.error("failed to mark chat as read:", err?.message || err);
      });
  };

  const hidePlate = () => {
    setState({ ...state, plate: PlateType.none });
  };

  const emojiPlate = () => {
    setState({ ...state, plate: PlateType.emoji });
  };

  const setMoreMenuAnchor = (event) => {
    setState({ ...state, moreMenuAnchor: event.currentTarget });
  };
  const releaseMoreMenuAnchor = (command) => {
    if (command) {
      command.payload = command.payload || {};
      dispatch(command);
    }
    setState({ ...state, moreMenuAnchor: null });
  };

  useEffect(() => {
    activeChatIdRef.current = chatId;
    initialUnreadRef.current = getUnreadCount(chat);
    markReadInFlightRef.current = false;
    userInteractedRef.current = false;

    setState((prev) => ({ ...prev, loading: true }));

    fetchMessages(chatId).then((res) => {
      const sortedMessages = [...res.data].sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      );

      setState((prev) => ({
        ...prev,
        messages: sortedMessages,
        loading: false,
      }));
    });
  }, [chatId]);

  useEffect(() => {
    if (state.loading || !state.messages.length) return;

    const unreadCount = initialUnreadRef.current;
    if (unreadCount > 0) {
      const anchorIndex = Math.max(state.messages.length - unreadCount, 0);
      const anchorMessage = state.messages[anchorIndex];
      const anchorId = extractMessageId(anchorMessage);
      setUnreadAnchorId(anchorId || null);
      return;
    }

    setUnreadAnchorId(null);
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }

    markCurrentChatReadIfNeeded();
  }, [state.loading, state.messages]);

  useEffect(() => {
    if (unreadAnchorId && unreadMarkerRef.current) {
      unreadMarkerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    markCurrentChatReadIfNeeded();
  }, [unreadAnchorId, state.messages]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;

    const onUserIntent = () => {
      userInteractedRef.current = true;
    };

    const onScroll = () => {
      markCurrentChatReadIfNeeded();
    };

    list.addEventListener("wheel", onUserIntent, { passive: true });
    list.addEventListener("touchstart", onUserIntent, { passive: true });
    list.addEventListener("mousedown", onUserIntent);
    list.addEventListener("keydown", onUserIntent);
    list.addEventListener("scroll", onScroll);
    return () => {
      list.removeEventListener("wheel", onUserIntent);
      list.removeEventListener("touchstart", onUserIntent);
      list.removeEventListener("mousedown", onUserIntent);
      list.removeEventListener("keydown", onUserIntent);
      list.removeEventListener("scroll", onScroll);
    };
  }, [state.loading, state.messages]);

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

  const handleInputChange = (e) => {
    const el = e.target;
    setInputText(el.value);
    // auto-resize
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSend = () => {
    if (!inputText.trim()) {
      // placeholder for voice recording action
      return;
    }

    // temporary send - integrate with real send API/event
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
            <div className="title">{chat.name}</div>
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
      <main
        ref={messageListRef}
        className={state.loading ? "loading" : ""}
      >
        {state.loading ? (
          <div className="loader-wrapper">
            <AnimatedLoader />
          </div>
        ) : (
          state.messages.map((msg, index) => {
            const messageId = extractMessageId(msg) || `msg-${index}`;
            const isUnreadAnchor =
              unreadAnchorId && messageId === unreadAnchorId;

            return (
              <div
                key={messageId}
              >
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
              className={`send-action action-holder ${inputText.trim() ? "has-text" : ""}`}
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
