import { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SEOHead from './components/SEOHead';
import Home from './pages/Home';
import Create from './pages/Create';
import Contests from './pages/Contests';
import Settings from './pages/Settings';
import Contact from './pages/Contact';
import Faucet from './pages/Faucet';
import { useFactory } from './lib/useFactory';

function LangWrapper({ children }) {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  useEffect(() => {
    if (lang && ['en', 'bg', 'es'].includes(lang) && i18n.language !== lang) i18n.changeLanguage(lang);
  }, [lang, i18n]);
  return (
    <>
      <SEOHead />
      {children}
    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const factory = useFactory();
  const showAdmin = factory.role === 'owner';

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navbar role={factory.role} showAdmin={showAdmin} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/en" replace />} />
            <Route path="/:lang" element={<LangWrapper><Home factory={factory} /></LangWrapper>} />
            <Route path="/:lang/create" element={<LangWrapper><Create factory={factory} /></LangWrapper>} />
            <Route path="/:lang/contests" element={<LangWrapper><Contests factory={factory} /></LangWrapper>} />
            <Route path="/:lang/contact" element={<LangWrapper><Contact /></LangWrapper>} />
            <Route path="/:lang/settings" element={<LangWrapper><Settings factory={factory} /></LangWrapper>} />
            <Route path="*" element={<Navigate to="/en" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
}
