import {
  QR_CODE_REQUEST_GENERATED,
  OPEN_CHAT_START,
  NEW_GROUP_COMMAND,
  NEW_COMMUNITY_COMMAND,
  ARCHIVE_COMMAND,
  SELECT_CHATS_COMMAND,
  SETTINGS_COMMAND,
  LOGOUT_COMMAND,
  CHAT_EXTENDED_HIDE_COMMAND,
  CHAT_SEARCH_COMMAND,
  CHAT_INFO_COMMAND,
  SELECT_CHAT_MESSAGES_COMMAND,
  CLOSE_CHAT_COMMAND,
  MUTE_CHAT_COMMAND,
  CLEAR_CHAT_COMMAND,
  DELETE_CHAT_COMMAND,
  REPORT_CHAT_COMMAND,
  BLOCK_CHAT_COMMAND,
  CHAT_RESET_OPERATION_COMMAND,
  APP_LOADED,
  CHAT_MESSAGE_RECEIVED,

  APP_AUTHENTICATE,
  APP_LOADING_PROGRESS,
  APP_READY
} from "./actions";
import { defaultOperations } from "./defaults";

const getChatSerializedId = (chat) =>
  (chat &&
    chat.id &&
    (chat.id._serialized ||
      (chat.id.user && chat.id.server && `${chat.id.user}@${chat.id.server}`) ||
      chat.id)) ||
  chat?.id;

const extractChatIdFromMessage = (message) =>
  message?.fromMe ? message?.to : message?.from;

const reducer = (state, action) => {
  switch (action.type) {
    case APP_AUTHENTICATE:
      return {
        ...state,
        authenticated: true,
        user: {}
      };
    case APP_LOADING_PROGRESS:
      return {
        ...state,
        loadingPercent: action.payload.percent
      };
    case APP_READY:
      return {
        ...state,
        loading: false,
        user: {}
      };
    case QR_CODE_REQUEST_GENERATED:
      return {
        ...state,
        qrCode: action.payload,
      };
    case OPEN_CHAT_START:
      return {
        ...state,
        chat: action.payload,
      };

    case CLOSE_CHAT_COMMAND:
      return {
        ...state,
        chat: null,
      };

    case CHAT_INFO_COMMAND:
      return {
        ...state,
        infoPlate: true,
        searchPlate: false,
      };

    case CHAT_SEARCH_COMMAND:
      return {
        ...state,
        infoPlate: false,
        searchPlate: true,
      };

    case CHAT_EXTENDED_HIDE_COMMAND:
      return {
        ...state,
        infoPlate: false,
        searchPlate: false,
      };
    case MUTE_CHAT_COMMAND:
      return {
        ...state,
        operations: {
          ...defaultOperations,
          chatForMute: action.payload,
        },
      };
    case BLOCK_CHAT_COMMAND:
      return {
        ...state,
        operations: {
          ...defaultOperations,
          chatForBlock: action.payload,
        },
      };
    case REPORT_CHAT_COMMAND:
      return {
        ...state,
        operations: {
          ...defaultOperations,
          chatForReport: action.payload,
        },
      };
    case CLEAR_CHAT_COMMAND:
      return {
        ...state,
        operations: {
          ...defaultOperations,
          chatForClear: action.payload,
        },
      };
    case DELETE_CHAT_COMMAND:
      return {
        ...state,
        operations: {
          ...defaultOperations,
          chatForDelete: action.payload,
        },
      };
    case CHAT_RESET_OPERATION_COMMAND:
      return {
        ...state,
        operations: { ...defaultOperations },
      };
    case APP_LOADED:
      // accept both array payload or { chats: [...] }
      const chatsPayload = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.chats || [];
      return {
        ...state,
        loading: false,
        chats: chatsPayload,
      };
    case CHAT_MESSAGE_RECEIVED: {
      const message = action.payload?.msg || action.payload?.message || action.payload;
      if (!message) return state;

      const chatId = extractChatIdFromMessage(message);
      if (!chatId) return state;
      if (chatId === "status@broadcast") return state; // statuses belong to status viewer, not chat list

      const isCurrentChat =
        state.chat && getChatSerializedId(state.chat) === chatId;

      const mapChat = (chat) => {
        const serializedId = getChatSerializedId(chat);
        if (serializedId !== chatId) return chat;

        const unreadBase = chat.unreadCount ?? chat.unread ?? 0;
        const unreadCount = isCurrentChat ? 0 : unreadBase + 1;

        return {
          ...chat,
          timestamp: message.timestamp || chat.timestamp,
          lastMessage: {
            ...(chat.lastMessage || {}),
            text: message.body || (message._data && message._data.body) || "",
          },
          unreadCount,
          unread: unreadCount,
        };
      };

      const existingChat = state.chats.find(
        (chat) => getChatSerializedId(chat) === chatId
      );

      const updatedChat = existingChat
        ? mapChat(existingChat)
        : {
            id: { _serialized: chatId },
            name:
              message.notifyName ||
              (message._data && (message._data.notifyName || message._data.pushname)) ||
              chatId,
            timestamp: message.timestamp || Date.now() / 1000,
            unreadCount: isCurrentChat ? 0 : 1,
            unread: isCurrentChat ? 0 : 1,
            lastMessage: { text: message.body || "" },
          };

      // move updated chat to top
      const filteredChats = state.chats.filter(
        (chat) => getChatSerializedId(chat) !== chatId
      );

      return {
        ...state,
        chats: [updatedChat, ...filteredChats],
        chat: isCurrentChat ? { ...state.chat, ...updatedChat } : state.chat,
      };
    }
    default:
      console.log("here");
      return state;
  }
};

export default reducer;
