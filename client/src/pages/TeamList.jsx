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
      <p className="sub">Équipes ouvertes en {promo}. Choisis ton équipe : son capitaine devra valider ta demande.</p>
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
