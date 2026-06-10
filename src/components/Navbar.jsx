import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import GembaLogo from './GembaLogo';
import WalletButton from './WalletButton';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'bg', label: 'Български', flag: '🇧🇬' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function Navbar({ role, showAdmin }) {
  const { t, i18n } = useTranslation();
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { lang: paramLang } = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const h = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    const p = location.pathname.split('/');
    if (p[1] && ['en', 'bg', 'es'].includes(p[1])) {
      p[1] = code;
      navigate(p.join('/') || `/${code}`);
    } else {
      navigate(`/${code}`);
    }
    setLangOpen(false);
  };

  const lang = paramLang && ['en', 'bg', 'es'].includes(paramLang) ? paramLang : i18n.language;
  const navLinks = [
    { to: `/${lang}`, label: t('nav.home') },
    { to: `/${lang}/create`, label: t('nav.create') },
    { to: `/${lang}/contests`, label: t('nav.contests') },
    { to: `/${lang}/faucet`, label: t('nav.faucet') },
    { to: `/${lang}/contact`, label: t('nav.contact') },
    { to: `/${lang}/settings`, label: t('nav.settings'), hide: !showAdmin },
  ].filter(l => !l.hide);

  const active = (to) => location.pathname === to || (to !== `/${lang}` && location.pathname.startsWith(to));

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={`/${lang}`} className="flex items-center gap-2.5 no-underline">
            <GembaLogo size={32} animated />
            <span className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {t('brand.name')}
            </span>
            <span className="hidden sm:inline text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
              — {t('brand.by')}
            </span>
          </Link>
          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className="text-sm font-medium no-underline transition-colors duration-200" style={{ color: active(link.to) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <WalletButton role={role} />

            <div className="relative" ref={langRef}>
              <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)', background: 'transparent' }} aria-label="Language">
                <span>{currentLang.flag}</span><span>{currentLang.code.toUpperCase()}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 w-40 rounded-lg overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', zIndex: 60 }}>
                  {languages.map(l => (
                    <button key={l.code} onClick={() => switchLang(l.code)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer" style={{ background: l.code === i18n.language ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)', border: 'none', fontFamily: 'var(--font-body)' }}>
                      <span>{l.flag}</span><span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={toggle} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)' }} aria-label="Toggle theme">
              {dark
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden w-8 h-8 flex items-center justify-center cursor-pointer" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }} aria-label="Menu">
              {mobileOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>}
            </button>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium no-underline" style={{ color: active(link.to) ? 'var(--text-primary)' : 'var(--text-secondary)', backgroundColor: active(link.to) ? 'var(--bg-secondary)' : 'transparent' }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
