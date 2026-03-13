const LINK_REGEX =
  /((?:https?:\/\/|www\.)[^\s<]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s<]*)?)/gi;

const stripTrailingPunctuation = (value) => {
  let url = value;
  let trailing = "";

  while (/[),.!?;:]$/.test(url)) {
    trailing = url.slice(-1) + trailing;
    url = url.slice(0, -1);
  }

  return { url, trailing };
};

export const toMarkdownWithLinks = (text) => {
  const input = String(text || "");

  return input.replace(LINK_REGEX, (match) => {
    if (match.includes("](")) return match;

    const { url, trailing } = stripTrailingPunctuation(match);
    if (!url) return match;

    const href =
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("mailto:")
        ? url
        : `https://${url}`;

    return `[${url}](${href})${trailing}`;
  });
};

