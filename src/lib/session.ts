export interface WidgetSessionData {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
}

// tc-widget-session-{uid} — user profile data, keyed by user id
export const widgetSession = {
  key: (uid: number) => `tc-widget-session-${uid}`,

  set(data: WidgetSessionData): void {
    localStorage.setItem(widgetSession.key(data.id), JSON.stringify(data));
  },

  get(uid: number): WidgetSessionData | null {
    const raw = localStorage.getItem(widgetSession.key(uid));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as WidgetSessionData;
    } catch {
      return null;
    }
  },

  clear(uid: number): void {
    localStorage.removeItem(widgetSession.key(uid));
  },
};

// tc-i18nextLng — UI language, default "fr"
export const i18nLang = {
  key: "tc-i18nextLng",

  get(): string {
    return localStorage.getItem(i18nLang.key) ?? "fr";
  },

  set(lang: string): void {
    localStorage.setItem(i18nLang.key, lang);
  },

  init(): void {
    if (!localStorage.getItem(i18nLang.key)) {
      localStorage.setItem(i18nLang.key, "fr");
    }
  },
};

// tc-lastExternalReferrer — origin of the visitor's first external source
// tc-lastExternalReferrerTime — Unix ms timestamp of that first visit
export function trackExternalReferrer(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("tc-lastExternalReferrer")) return;

  let source = "other";

  try {
    const referrer = document.referrer;
    if (referrer) {
      const referrerOrigin = new URL(referrer).origin;
      if (referrerOrigin !== window.location.origin) {
        source = referrerOrigin;
      }
    }
  } catch {
    // noop — invalid referrer URL
  }

  localStorage.setItem("tc-lastExternalReferrer", source);
  localStorage.setItem("tc-lastExternalReferrerTime", String(Date.now()));
}
