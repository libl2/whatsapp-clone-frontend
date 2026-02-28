import React, { useEffect, useState } from "react";
import Wrapper from "./avatar.styled";
import GroupIcon from "../icons/group.icon";
import UserIcon from "../icons/user.icon";
import { fetchAvatarUrl } from "../../services/api.service";
import { getChatSerializedId } from "../../utils/chat";

const Avatar = ({ chat }) => {
  const [avatar, setAvatar] = useState("");
  const chatId = getChatSerializedId(chat);

  useEffect(() => {
    if (!chatId) return;

    fetchAvatarUrl(chatId)
      .then((res) => {
        setAvatar(res.data.avatar);
      })
      .catch(() => {
        setAvatar("");
      });
  }, [chatId]);

  const url = avatar || chat.avatar;

  return (
    <Wrapper className="chat-avatar">
      {url && <img src={url} alt="" />}
      {!url && chat.isGroup && <GroupIcon />}
      {!url && !chat.isGroup && <UserIcon />}
    </Wrapper>
  );
};

export default Avatar;
