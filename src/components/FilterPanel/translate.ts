import { useI18n } from '@ws-ui/webform-editor';
import { useCallback } from 'react';

import { TLabel } from './FilterPanel.config';

// Labels are either translation keys of the app (Shared/i18n.json) or plain text
export function useTranslate(): (text?: TLabel) => string {
  const { i18n } = useI18n();
  const lang = i18n?.userLang?.primary;
  return useCallback(
    (text?: TLabel) => {
      if (!text) return '';
      const key = typeof text === 'object' ? text.key : text;
      const fallback = typeof text === 'object' ? text.default : text;
      const entry = i18n?.keys?.[key];
      return (lang && entry?.[lang]) || fallback;
    },
    [i18n, lang],
  );
}
