import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useReg } from '../state.jsx';
import { Back, ErrorBox, Progress, Spinner } from '../ui.jsx';

export default function TeamList() {
  const nav = useNavigate();
  const { promo } = useReg();
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!promo) return;
    api.listTeams(promo).then(setTeams).catch((e) => setError(e.message));
  }, [promo]);

  if (!promo) return <Navigate to="/inscription" replace />;

  return (
    <>
      <Back to="/inscription" />
      <Progress step={3} />
      <h2>Rejoins une équipe</h2>
      <p className="sub">Saisis le code d’invitation donné par ton capitaine, ou choisis une équipe ouverte en {promo}. Le capitaine devra valider ta demande.</p>
      <form className="row" style={{ marginBottom: 22 }}
        onSubmit={(e) => { e.preventDefault(); if (code.trim()) nav('/equipe/' + code.trim().toUpperCase()); }}>
        <input type="text" placeholder="Code d’invitation (ex. 8BQRFN)" aria-label="Code d’invitation" maxLength={12}
          value={code} onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
          style={{ flex: 1, minWidth: 160, textTransform: 'uppercase' }} />
        <button className="btn sm" style={{ minHeight: 48 }} disabled={code.trim().length < 3}>Valider</button>
      </form>
      <ErrorBox>{error}</ErrorBox>
      {!teams && !error && <Spinner />}
      {teams && teams.map((t) => {
        const left = t.max - t.count;
        return (
          <div className="team" key={t.code}>
            <div>
              <b>{t.name}</b>
              <small>{t.count}/{t.max} joueurs · {t.full ? 'complète' : `${left} place${left > 1 ? 's' : ''}`}</small>
            </div>
            {t.full
              ? <span className="tag">Complète</span>
              : <button className="btn sm" onClick={() => nav('/equipe/' + t.code)}>Rejoindre</button>}
          </div>
        );
      })}
      {teams && !teams.length && (
        <p className="sub">Aucune équipe ouverte pour le moment. Crée la tienne ou inscris-toi en solo.</p>
      )}
      <button className="btn alt" onClick={() => nav('/inscription/solo')}>
        Je ne trouve pas mon équipe — inscription solo
      </button>
    </>
  );
}
