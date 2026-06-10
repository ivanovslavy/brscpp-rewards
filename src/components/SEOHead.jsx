import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';

const SITE_NAME = 'GembaWin by GEMBA IT';
const SITE_URL = 'https://win.gembait.com';
const DEFAULT_TITLE = 'GembaWin — On-Chain Bounties & Reward Contests by GEMBA IT';
const DEFAULT_DESC =
  'Permissionless on-chain bounty & reward contests. Launch a contest with any number of prize positions, fund them in GMB or any ERC-20, name winners, and let them claim trustlessly. Built on GembaBlockchain Testnet by GEMBA IT.';
const OG_IMAGE = `${SITE_URL}/og/gembawin.png`;
const LANGS = ['en', 'bg', 'es'];
const LOCALE = { en: 'en_US', bg: 'bg_BG', es: 'es_ES' };

function swapLang(pathname, targetLang) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return `/${targetLang}`;
  if (LANGS.includes(parts[0])) parts[0] = targetLang;
  else parts.unshift(targetLang);
  return '/' + parts.join('/');
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href, hreflang) {
  const selector = hreflang
    ? `link[rel="alternate"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function SEOHead() {
  const { t, i18n } = useTranslation();
  const { lang: routeLang } = useParams();
  const { pathname } = useLocation();
  const lang = LANGS.includes(routeLang) ? routeLang : i18n.language || 'en';

  useEffect(() => {
    const title = t('seo.home.title', { defaultValue: '' });
    const desc = t('seo.home.description', { defaultValue: '' });

    const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
    const fullDesc = desc || DEFAULT_DESC;
    const canonical = `${SITE_URL}${pathname}`;

    document.title = fullTitle;
    document.documentElement.lang = lang;

    setMeta('name', 'description', fullDesc);
    setLink('canonical', canonical);

    LANGS.forEach((l) => setLink('alternate', `${SITE_URL}${swapLang(pathname, l)}`, l));
    setLink('alternate', `${SITE_URL}${swapLang(pathname, 'en')}`, 'x-default');

    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', fullDesc);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:locale', LOCALE[lang] || 'en_US');
    setMeta('property', 'og:image', OG_IMAGE);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', fullTitle);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', fullDesc);
    setMeta('name', 'twitter:image', OG_IMAGE);
  }, [pathname, lang, t]);

  return null;
}
