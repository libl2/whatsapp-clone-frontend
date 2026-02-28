export const getChatSerializedId = (chat) => {
  const id = chat?.id;

  if (!id) return null;
  if (typeof id === "string") return id;
  if (id._serialized) return id._serialized;
  if (id.user && id.server) return `${id.user}@${id.server}`;

  return id.id || null;
};

export const getDisplayNameFromId = (id) => {
  if (!id) return "Unknown contact";
  return String(id).replace(/@(c\.us|s\.whatsapp\.net|g\.us)$/, "");
};

export const getChatDisplayName = (chat) => {
  const candidates = [
    chat?.name,
    chat?.title,
    chat?.formattedTitle,
    chat?.contact?.name,
    chat?.contact?.pushname,
    chat?.contact?.shortName,
    chat?.contact?.number,
    chat?.notifyName,
    chat?.pushname,
  ];

  const resolved = candidates.find(
    (value) => typeof value === "string" && value.trim()
  );
  if (resolved) return resolved.trim();

  return getDisplayNameFromId(getChatSerializedId(chat));
};
