import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useEvent } from '../state.jsx';
import { Back, Spinner } from '../ui.jsx';
import Closed from './Closed.jsx';
import FormPage from './FormPage.jsx';

export default function JoinTeam() {
  const { code } = useParams();
  const nav = useNavigate();
  const { event } = useEvent();
  const [team, setTeam] = useState(undefined); // undefined = chargement, null = introuvable

  useEffect(() => {
    setTeam(undefined);
    api.getTeam(code).then(setTeam).catch(() => setTeam(null));
  }, [code]);

  if (event && !event.registrationsOpen) return <Closed />;
  if (team === undefined) return <Spinner />;

  if (team === null) {
    return (
      <>
        <Back to="/" />
        <h2>Code inconnu</h2>
        <p className="sub">Ce code d’invitation ne correspond à aucune équipe ouverte. Vérifie-le auprès de ton capitaine.</p>
        <button className="btn" onClick={() => nav('/inscription')}>Voir les autres options</button>
      </>
    );
  }

  if (team.full) {
    return (
      <>
        <Back to="/" />
        <h2>Équipe complète</h2>
        <p className="sub"><b>{team.name}</b> a déjà ses {team.max} joueurs. Rejoins une autre équipe ou inscris-toi en solo.</p>
        <button className="btn" onClick={() => nav('/equipes')}>Voir les équipes ouvertes</button>
      </>
    );
  }

  return (
    <FormPage
      backTo="/equipes" title={`Rejoins ${team.name}`}
      sub={`Équipe ${team.promo} · ${team.count}/${team.max} joueurs. Le capitaine devra valider ta demande.`}
      step={3} kind="member" promo={team.promo} extra={{ teamCode: team.code }} submitLabel="Envoyer ma demande"
    />
  );
}
