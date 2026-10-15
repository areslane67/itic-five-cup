import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorBox, Spinner } from '../ui.jsx';

export default function Captain() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.getCaptain(token)); setError(''); }
    catch (ex) { if (ex.status === 404) setInvalid(true); else setError(ex.message); }
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000); // les nouvelles demandes apparaissent seules
    return () => clearInterval(id);
  }, [load]);

  async function decide(id, action) {
    setBusy(id);
    try { await api.decide(token, id, action); setError(''); }
    catch (ex) { setError(ex.message); }
    await load();
    setBusy(null);
  }

  if (invalid) {
    return (
      <>
        <h2>Lien invalide</h2>
        <p className="sub">Ce lien capitaine ne correspond à aucune équipe. Vérifie-le ou contacte le BDE.</p>
      </>
    );
  }
  if (!data) return <><ErrorBox>{error}</ErrorBox><Spinner /></>;

  const { team, members, requests } = data;
  const link = `${window.location.origin}/equipe/${team.code}`;
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); }
    catch { window.prompt('Copie ce lien :', link); }
  }

  return (
    <>
      <h2>{team.name}</h2>
      <p className="sub">Équipe {team.promo} · {team.count}/{team.max} joueurs{team.full ? ' · complète' : ''}</p>
      <ErrorBox>{error}</ErrorBox>

      <div className="recap" style={{ padding: 16 }}>
        <p>Code d’invitation à partager :</p>
        <div className="code" style={{ margin: '10px 0' }}>{team.code}</div>
        <button className="btn alt sm" onClick={copy}>{copied ? 'Lien copié ✓' : 'Copier le lien d’invitation'}</button>
      </div>

      <h3 style={{ fontSize: 28, margin: '28px 0 10px' }}>Demandes en attente ({requests.length})</h3>
      {!requests.length && <p className="sub" style={{ margin: 0 }}>Aucune demande pour le moment. Cette page se met à jour toute seule.</p>}
      {requests.map((r) => (
        <div className="team" key={r.id} style={{ flexWrap: 'wrap' }}>
          <div>
            <b>{r.firstName} {r.lastName}</b>
            <small>{[r.className, r.level].filter(Boolean).join(' · ') || 'Aucune info supplémentaire'}</small>
          </div>
          <div className="row">
            <button className="btn sm" disabled={busy === r.id || team.full} onClick={() => decide(r.id, 'accept')}>Accepter</button>
            <button className="btn alt sm" disabled={busy === r.id} onClick={() => decide(r.id, 'reject')}>Refuser</button>
          </div>
        </div>
      ))}
      {team.full && requests.length > 0 && <p className="note">Ton équipe est complète : tu peux seulement refuser les demandes restantes.</p>}

      <h3 style={{ fontSize: 28, margin: '28px 0 10px' }}>Joueurs de l’équipe</h3>
      <div className="recap">
        {members.map((m) => (
          <div key={m.id}><b>{m.firstName} {m.lastName}</b><span>{m.mode === 'captain' ? 'Capitaine' : 'Joueur'}</span></div>
        ))}
      </div>
      <p className="note">Ce lien est personnel : ne le partage pas. Besoin d’aide ? Contacte le BDE.</p>
    </>
  );
}
