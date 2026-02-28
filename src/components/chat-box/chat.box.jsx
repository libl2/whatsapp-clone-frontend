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
import { fetchMessages, markChatAsRead } from "../../services/api.service";
import { socket } from "../../services/socket.service";
import moment from "moment";
import { getChatDisplayName, getChatSerializedId } from "../../utils/chat";

const READ_MESSAGES_STORAGE_KEY = "readMessageIdsByChat";

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

const readStore = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(READ_MESSAGES_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  },
  getChatReadSet(chatId) {
    const all = this.get();
    return new Set(Array.isArray(all[chatId]) ? all[chatId] : []);
  },
  add(chatId, messageId) {
    if (!chatId || !messageId) return;
    const all = this.get();
    const existing = new Set(Array.isArray(all[chatId]) ? all[chatId] : []);
    existing.add(messageId);
    all[chatId] = Array.from(existing);
    localStorage.setItem(READ_MESSAGES_STORAGE_KEY, JSON.stringify(all));
  },
};

const ChatBox = () => {
  const { chat, dispatch, showChatSearch } = useAppContext();
  const [state, setState] = useState(initialState);
  const [unreadAnchorId, setUnreadAnchorId] = useState(null);
  const [inputText, setInputText] = useState("");
  const messageListRef = useRef(null);
  const unreadMarkerRef = useRef(null);
  const textareaRef = useRef(null);
  const activeChatIdRef = useRef(null);
  const markReadInFlightRef = useRef(false);
  const observerRef = useRef(null);
  const messageNodesRef = useRef(new Map());
  const unreadMessageIdsRef = useRef(new Set());
  const readUnreadMessageIdsRef = useRef(new Set());
  const initialUnreadScrollDoneRef = useRef(false);

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

  const syncUnreadCount = (nextCount) => {
    if (!activeChatIdRef.current) return;
    dispatch({
      type: CHAT_UNREAD_COUNT_UPDATED,
      payload: { chatId: activeChatIdRef.current, unreadCount: Math.max(0, nextCount) },
    });
  };

  const markWholeChatAsRead = () => {
    const activeChatId = activeChatIdRef.current;
    if (!activeChatId || markReadInFlightRef.current) return;

    markReadInFlightRef.current = true;
    markChatAsRead(activeChatId)
      .then(() => {
        dispatch({
          type: CHAT_MARKED_AS_READ,
          payload: { chatId: activeChatId },
        });
      })
      .catch((err) => {
        markReadInFlightRef.current = false;
        console.error("failed to mark chat as read:", err?.message || err);
      });
  };

  const onUnreadMessageViewed = (messageId) => {
    if (!messageId) return;
    if (!unreadMessageIdsRef.current.has(messageId)) return;
    if (readUnreadMessageIdsRef.current.has(messageId)) return;

    readUnreadMessageIdsRef.current.add(messageId);
    readStore.add(activeChatIdRef.current, messageId);

    const remaining =
      unreadMessageIdsRef.current.size - readUnreadMessageIdsRef.current.size;

    syncUnreadCount(remaining);

    if (remaining <= 0 && unreadMessageIdsRef.current.size > 0) {
      setUnreadAnchorId(null);
      markWholeChatAsRead();
    }
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
    unreadMessageIdsRef.current = new Set();
    readUnreadMessageIdsRef.current = new Set();
    initialUnreadScrollDoneRef.current = false;
    setUnreadAnchorId(null);

    setState((prev) => ({ ...prev, loading: true, messages: [] }));

    fetchMessages(chatId).then((res) => {
      if (activeChatIdRef.current !== chatId) return;

      const sortedMessages = [...(res.data || [])].sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      );

      const unreadCount = getUnreadCount(chat);
      const candidateUnreadIds = sortedMessages
        .slice(Math.max(sortedMessages.length - unreadCount, 0))
        .map((message) => extractMessageId(message))
        .filter(Boolean);

      unreadMessageIdsRef.current = new Set(candidateUnreadIds);

      const persistedReadForChat = readStore.getChatReadSet(chatId);
      const readUnreadIds = candidateUnreadIds.filter((id) =>
        persistedReadForChat.has(id)
      );
      readUnreadMessageIdsRef.current = new Set(readUnreadIds);

      const firstUnreadId = candidateUnreadIds.find(
        (id) => !readUnreadMessageIdsRef.current.has(id)
      );

      setUnreadAnchorId(firstUnreadId || null);
      syncUnreadCount(candidateUnreadIds.length - readUnreadIds.length);

      setState((prev) => ({
        ...prev,
        messages: sortedMessages,
        loading: false,
      }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (state.loading || !state.messages.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const viewedMessageId = entry.target.getAttribute("data-message-id");
          onUnreadMessageViewed(viewedMessageId);
        });
      },
      {
        threshold: 0.72,
      }
    );

    state.messages.forEach((message) => {
      const id = extractMessageId(message);
      if (!id) return;
      if (!unreadMessageIdsRef.current.has(id)) return;
      if (readUnreadMessageIdsRef.current.has(id)) return;

      const node = messageNodesRef.current.get(id);
      if (node) {
        observerRef.current.observe(node);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loading, state.messages]);

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

  const attachMessageNode = (messageId, node) => {
    if (!messageId) return;
    if (!node) {
      messageNodesRef.current.delete(messageId);
      return;
    }

    messageNodesRef.current.set(messageId, node);
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
                data-message-id={messageId}
                ref={(node) => attachMessageNode(messageId, node)}
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

