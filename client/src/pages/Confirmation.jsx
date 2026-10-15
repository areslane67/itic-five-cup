import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { store, useReg } from '../state.jsx';

export default function Confirmation() {
  const nav = useNavigate();
  const { last: l } = useReg();
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!l) return;
    if (l.manageToken) store.set('manage', l.manageToken);
    if (l.trackToken) store.set('track', l.trackToken);
  }, [l]);

  if (!l) return <Navigate to="/" replace />;

  const origin = window.location.origin;
  async function copy(text, key) {
    try { await navigator.clipboard.writeText(text); setCopied(key); }
    catch { window.prompt('Copie ce lien :', text); }
  }

  const pending = l.status === 'pending';
  const inviteLink = `${origin}/equipe/${l.code}`;
  const captainLink = `${origin}/capitaine/${l.manageToken}`;
  const trackLink = `${origin}/suivi/${l.trackToken}`;

  return (
    <>
      <div className="ok" aria-hidden="true">{pending ? '…' : '✓'}</div>
      <h2>{pending ? 'Demande envoyée !' : 'C’est dans la boîte !'}</h2>
      <p className="sub">
        {pending
          ? `Le capitaine de ${l.teamName} doit valider ta demande. Garde le lien de suivi ci-dessous pour voir sa réponse.`
          : 'Ta préinscription est enregistrée. Le BDE te communiquera les prochaines informations.'}
      </p>
      <div className="recap">
        <div><span>Joueur</span><b>{l.name}</b></div>
        <div><span>Promotion</span><b>{l.promo}</b></div>
        <div><span>Participation</span><b>{{ solo: 'Solo — à affecter par le BDE', captain: 'Capitaine', member: 'Demande en attente' }[l.kind]}</b></div>
        {l.teamName && <div><span>Équipe</span><b>{l.teamName}</b></div>}
      </div>

      {l.kind === 'captain' && (
        <>
          <p>Partage ce code avec tes coéquipiers :</p>
          <div className="code">{l.code}</div>
          <p className="note" style={{ margin: '0 0 14px', wordBreak: 'break-all' }}>Lien : {inviteLink}</p>
          <button className="btn alt" style={{ marginBottom: 22 }} onClick={() => copy(inviteLink, 'invite')}>
            {copied === 'invite' ? 'Lien copié ✓' : 'Copier le lien d’invitation'}
          </button>
          <div className="recap" style={{ padding: 16 }}>
            <p><b>Ton lien capitaine</b> : c’est là que tu acceptes ou refuses les demandes. Il est personnel, ne le partage pas.</p>
            <button className="btn alt sm" style={{ marginTop: 12 }} onClick={() => copy(captainLink, 'captain')}>
              {copied === 'captain' ? 'Lien copié ✓' : 'Copier mon lien capitaine'}
            </button>
          </div>
          <button className="btn" onClick={() => nav('/capitaine/' + l.manageToken)}>Gérer mon équipe</button>
        </>
      )}

      {l.kind !== 'captain' && (
        <>
          {l.kind === 'member' && (
            <button className="btn alt" style={{ marginBottom: 12 }} onClick={() => copy(trackLink, 'track')}>
              {copied === 'track' ? 'Lien copié ✓' : 'Copier mon lien de suivi'}
            </button>
          )}
          <p className="note" style={{ marginBottom: 14 }}>Date, lieu et prix seront communiqués par le BDE.</p>
          {l.kind === 'member'
            ? <button className="btn" onClick={() => nav('/suivi/' + l.trackToken)}>Suivre ma demande</button>
            : <button className="btn" onClick={() => nav('/')}>Retour à l’accueil</button>}
        </>
      )}
    </>
  );
}
