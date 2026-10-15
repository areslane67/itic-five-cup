import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useReg } from '../state.jsx';
import { ErrorBox, Spinner } from '../ui.jsx';

export default function Tracking() {
  const { token } = useParams();
  const nav = useNavigate();
  const { setPromo } = useReg();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);

  const load = useCallback(async () => {
    try { setD(await api.getTracking(token)); setError(''); }
    catch (ex) { if (ex.status === 404) setInvalid(true); else setError(ex.message); }
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  if (invalid) return <><h2>Lien invalide</h2><p className="sub">Ce lien de suivi ne correspond à aucune inscription.</p></>;
  if (!d) return <><ErrorBox>{error}</ErrorBox><Spinner /></>;

  const go = (to) => { setPromo(d.promo); nav(to); };
  let icon = '✓', title, text, actions = null;

  if (d.status === 'pending') {
    icon = '…'; title = 'En attente';
    text = `Le capitaine de ${d.teamName} n’a pas encore répondu. Cette page se met à jour toute seule.`;
  } else if (d.status === 'rejected') {
    icon = '✕'; title = 'Demande refusée';
    text = `Le capitaine de ${d.teamName} n’a pas retenu ta demande. Tu peux rejoindre une autre équipe ou t’inscrire en solo.`;
    actions = (
      <>
        <button className="btn" style={{ marginBottom: 12 }} onClick={() => go('/equipes')}>Voir les autres équipes</button>
        <button className="btn alt" onClick={() => go('/inscription/solo')}>M’inscrire en solo</button>
      </>
    );
  } else if (d.status === 'cancelled') {
    icon = '✕'; title = 'Inscription annulée'; text = 'Cette inscription a été annulée par le BDE.';
  } else if (d.teamName) {
    title = 'Tu es dans l’équipe !'; text = `Bienvenue dans ${d.teamName}. Le BDE te communiquera les prochaines informations.`;
  } else {
    title = 'Inscription enregistrée'; text = 'Le BDE va te trouver une équipe.';
  }

  return (
    <>
      <div className="ok" aria-hidden="true" style={d.status === 'rejected' || d.status === 'cancelled' ? { background: 'var(--err)' } : undefined}>{icon}</div>
      <h2>{title}</h2>
      <p className="sub">{text}</p>
      <div className="recap">
        <div><span>Joueur</span><b>{d.name}</b></div>
        <div><span>Promotion</span><b>{d.promo}</b></div>
        {d.teamName && <div><span>Équipe</span><b>{d.teamName}</b></div>}
      </div>
      {actions}
      <button className="link" style={{ marginTop: 12 }} onClick={() => nav('/')}>Retour à l’accueil</button>
    </>
  );
}
