import { useEffect } from 'react';
import { useLocaleStore } from '../store/localeStore';

/** Met à jour l'attribut lang du document pour l'accessibilité et le navigateur. */
const HtmlLang = () => {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'fr';
  }, [locale]);

  return null;
};

export default HtmlLang;
