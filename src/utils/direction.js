const RTL_LANGS = new Set([
  "ar",
  "fa",
  "he",
  "iw",
  "ku",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
]);

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const isRtlLocale = (locale) => {
  const normalized = normalize(locale);
  if (!normalized) return false;
  const [base] = normalized.split("-");
  return RTL_LANGS.has(base);
};

export const detectDirection = (overrideLanguage) => {
  const candidates = [];

  if (overrideLanguage) {
    candidates.push(overrideLanguage);
  }

  if (typeof navigator !== "undefined") {
    if (Array.isArray(navigator.languages)) {
      candidates.push(...navigator.languages);
    }
    if (navigator.language) {
      candidates.push(navigator.language);
    }
  }

  const isRtl = candidates.some(isRtlLocale);
  return isRtl ? "rtl" : "ltr";
};

export const applyDocumentDirection = (direction = "ltr") => {
  if (typeof document === "undefined") return;
  const safeDirection = direction === "rtl" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", safeDirection);
  if (document.body) {
    document.body.setAttribute("dir", safeDirection);
  }
};

export const getDocumentDirection = () => {
  if (typeof document === "undefined") return "ltr";
  return document.documentElement.getAttribute("dir") || "ltr";
};
