// SPDX-License-Identifier: Apache-2.0
// i18n vi/en (GĐ 09). Mặc định `vi`, fallback `vi`; lựa chọn lưu localStorage (try/catch).
// Dùng `t()` trực tiếp (không cần hook): khi đổi ngôn ngữ, main.tsx remount cây UI theo `i18n.language`.

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from '../i18n/en.json';
import vi from '../i18n/vi.json';

export const LANGS = ['vi', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_KEY = 'dxfsm-lang';

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  supportedLngs: [...LANGS],
  fallbackLng: 'vi',
  nonExplicitSupportedLngs: false,
  load: 'languageOnly',
  interpolation: { escapeValue: false }, // React tự escape
  detection: {
    order: ['localStorage'], // không đoán theo trình duyệt: mặc định vi trừ khi người dùng chọn
    lookupLocalStorage: LANG_KEY,
    caches: [], // tự lưu trong setLang (try/catch) vì detector ném lỗi khi storage bị chặn
  },
  initAsync: false, // resources inline -> khởi tạo đồng bộ
});

const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng.slice(0, 2);
};
syncHtmlLang(i18n.language || 'vi');
i18n.on('languageChanged', syncHtmlLang);

export const t = i18n.t.bind(i18n);
export const currentLang = (): Lang => (i18n.language?.startsWith('en') ? 'en' : 'vi');
export const locale = (): string => (currentLang() === 'en' ? 'en-US' : 'vi-VN');
export const setLang = (lng: Lang) => {
  try {
    localStorage.setItem(LANG_KEY, lng);
  } catch {
    /* storage bị chặn: vẫn đổi ngôn ngữ cho phiên hiện tại */
  }
  return i18n.changeLanguage(lng);
};
export default i18n;
