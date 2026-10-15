import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Admin from './pages/Admin.jsx';
import Captain from './pages/Captain.jsx';
import Choose from './pages/Choose.jsx';
import Closed from './pages/Closed.jsx';
import Confirmation from './pages/Confirmation.jsx';
import FormPage from './pages/FormPage.jsx';
import Home from './pages/Home.jsx';
import JoinTeam from './pages/JoinTeam.jsx';
import TeamList from './pages/TeamList.jsx';
import Tracking from './pages/Tracking.jsx';
import { useEvent, useReg } from './state.jsx';

function Layout() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="wrap">
      <header className="bar">
        <button className="logo" onClick={() => nav('/')} aria-label="Accueil ITIC Five Cup">
          <img className="crest" src="/logo.png" alt="" width="48" height="48" />
          <span>ITIC<small>PARIS</small></span>
        </button>
        <span style={{ color: 'var(--mute)', fontSize: 13 }}>BDE ITIC Paris</span>
      </header>
      <main><Outlet /></main>
      {pathname === '/' &&<p className="demo"><button className="link" onClick={() => nav('/admin')}>Accès BDE</button></p>}
    </div>
  );
}

// Les pages d'inscription sont inaccessibles quand le BDE a fermé les inscriptions
function RequireOpen() {
  const { event } = useEvent();
  if (event && !event.registrationsOpen) return <Navigate to="/inscriptions-fermees" replace />;
  return <Outlet />;
}

function SoloForm() {
  const { promo } = useReg();
  if (!promo) return <Navigate to="/inscription" replace />;
  return <FormPage backTo="/inscription" title="Tes infos" sub="Quelques informations et c’est parti." step={3} kind="solo" promo={promo} />;
}

// Création d'équipe + infos du capitaine sur une seule page
function CreateTeam() {
  const { promo } = useReg();
  if (!promo) return <Navigate to="/inscription" replace />;
  return (
    <FormPage
      backTo="/inscription" title="Crée ton équipe"
      sub="Tu seras le capitaine et aussi enregistré comme joueur. Tu valideras toi-même les demandes de tes coéquipiers."
      step={3} kind="captain" promo={promo} withTeam submitLabel="Créer mon équipe"
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route element={<RequireOpen />}>
          <Route path="/inscription" element={<Choose />} />
          <Route path="/inscription/solo" element={<SoloForm />} />
          <Route path="/equipes" element={<TeamList />} />
          <Route path="/creer-equipe" element={<CreateTeam />} />
        </Route>
        <Route path="/equipe/:code" element={<JoinTeam />} />
        <Route path="/capitaine/:token" element={<Captain />} />
        <Route path="/suivi/:token" element={<Tracking />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/inscriptions-fermees" element={<Closed />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
