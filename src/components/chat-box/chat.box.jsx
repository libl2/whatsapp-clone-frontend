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
import { fetchMessages } from "../../services/api.service";
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
  const date = moment(chat.date).format("DD/MM/YYYY");

  const extractMessageId = (message) =>
    (message && message.id && (message.id._serialized || message.id.id)) ||
    message?.id;

  const getUnreadCount = (currentChat) =>
    currentChat?.unreadCount ?? currentChat?.unread ?? 0;

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
    setState((prev) => ({ ...prev, loading: true }));

    fetchMessages(chat.id._serialized).then((res) => {
      const sortedMessages = [...res.data].sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      );

      setState((prev) => ({
        ...prev,
        messages: sortedMessages,
        loading: false,
      }));
    });
  }, [chat]);

  useEffect(() => {
    if (state.loading || !state.messages.length) return;

    const unreadCount = getUnreadCount(chat);
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
  }, [state.loading, state.messages, chat]);

  useEffect(() => {
    if (unreadAnchorId && unreadMarkerRef.current) {
      unreadMarkerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [unreadAnchorId, state.messages]);

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
