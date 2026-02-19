import React, { useState } from "react";
import StatusViewer from "../status-viewer/status.viewer";
import { useAppContext } from "../../context/appContext";
import CommunitiesIcon from "../../components/icons/communities.icon";
import StatusIcon from "../../components/icons/status.icon";
import ChatIcon from "../../components/icons/chat.icon";
import MoreIcon from "../../components/icons/more.icon";
import PyramidIcon from "../../components/icons/pyramid.icon";
import Filter from "../../components/filter/filter";
import ChatNotification from "../../components/chat-notification/chat.notification";
import ChatItem from "../../components/chat-item/chat.item";
import HeaderMenu from "../../components/menus/header.menu";
import Me from "../../assets/images/me.jpeg";

const defaultNotification = {
  show: false,
  title: "",
  description: "",
  icon: "",
  command: "",
  badgeColor: "",
};

const initialState = {
  moreMenuAnchor: null,
  unreadOnly: false,
  notification: { ...defaultNotification },
  filtered: [],
};

const ChatSidebar = () => {
  const { openChat, dispatch, chats, chat: current } = useAppContext();
  const [state, setState] = useState(initialState);
  const [showStatus, setShowStatus] = useState(false);

  const toggleFilterUnRead = () => {
    const unread = !state.unreadOnly;
    const filtered = unread
      ? chats.filter((chat) => (chat.unreadCount ?? chat.unread ?? 0) > 0)
      : [];
    setState({ ...state, unreadOnly: unread, filtered });
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

  const pickChat = (chat) => {
    // todo: clean if nessasary
    openChat(chat);
  };
  const reactNotification = () => {
    console.log("reactNotification");
  };
  const closeNotification = () => {
    setState({
      ...state,
      notification: { ...defaultNotification },
    });
  };

  return (
  <>
    <header>
      {/* ... כל תוכן ההדר שלך נשאר זהה ... */}
      <div className="avatar">
        <img src={Me} alt="avatar" />
      </div>
      <div className="actions">
        <button>
          <CommunitiesIcon />
        </button>
        {/* הכפתור הזה פותח את הסטטוס */}
        <button onClick={() => setShowStatus(true)}>
          <StatusIcon />
        </button>
        <button>
          <ChatIcon />
        </button>
        <button onClick={setMoreMenuAnchor}>
          <MoreIcon />
        </button>
      </div>
      <HeaderMenu
        anchorEl={state.moreMenuAnchor}
        release={releaseMoreMenuAnchor}
      />
    </header>

    {/* =====[ התיקון נמצא כאן ]===== */}
    {/* 1. הסרנו את ה-div-ים העוטפים.
      2. העברנו את הפונקציה onClose לקומפוננטה.
    */}
    {showStatus && <StatusViewer onClose={() => setShowStatus(false)} />}
    
    {/* ... כל שאר הקוד של הקומפוננטה ממשיך מכאן ... */}
    <div className="inner-container">
      <div className="search-container">
        <Filter placeholder="Search or start a new chat" />
        <button
          onClick={toggleFilterUnRead}
          className={`filter-btn ${state.unreadOnly ? "active" : ""}`}
        >
          <PyramidIcon />
        </button>
      </div>

      <div
        className={`chats-container ${
          state.notification.show ? "has-notification" : ""
        }`}
      >
        {/* ... וכו' ... */}
        {(state.unreadOnly ? state.filtered : chats).map((chat) => (
          <ChatItem
            current={chat === current}
            key={chat.id.user}
            chat={chat}
            onPick={() => pickChat(chat)}
          />
        ))}
      </div>
    </div>
  </>
);
};

export default ChatSidebar;
