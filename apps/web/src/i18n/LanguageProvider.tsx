/* ============================================================
   LanguageProvider — global language + translation
   ============================================================ */

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { LanguageContext } from "./useLanguage";
import { detectLanguage, saveLanguage, t as translate } from "./index";
import type { Lang } from "./index";
import { getTelegramUser } from "../services/telegram";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const user = getTelegramUser();
  const [lang, setLangState] = useState<Lang>(() =>
    detectLanguage(user?.language_code ?? null),
  );

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    saveLanguage(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
