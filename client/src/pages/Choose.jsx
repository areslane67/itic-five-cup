import { useNavigate } from 'react-router-dom';
import { useReg } from '../state.jsx';
import { Back, Progress } from '../ui.jsx';

export default function Choose() {
  const nav = useNavigate();
  const { promo, setPromo } = useReg();

  const promoBtn = (p, s) => (
    <button className={'opt ' + (promo === p ? 'on' : '')} onClick={() => setPromo(p)}>
      <h3>{p}</h3><p>{s}</p>
    </button>
  );
  // Un clic sur une option emmène directement à l'étape suivante
  const modeBtn = (to, t, s) => (
    <button className="opt mode" onClick={() => nav(to)}>
      <h3>{t}</h3><p>{s}</p>
    </button>
  );

  return (
    <>
      <Back to="/" />
      <Progress step={promo ? 2 : 1} />
      <h2>Ta promotion ?</h2>
      <p className="sub">Choisis ton année. Tu ne pourras rejoindre que les équipes de ta promotion.</p>
      {promoBtn('BTS 1', 'Les challengers')}
      {promoBtn('BTS 2', 'Les tenants du titre')}
      {promo && (
        <>
          <h2 style={{ marginTop: 34 }}>Comment veux-tu participer ?</h2>
          <p className="sub">Choisis l’option qui te correspond.</p>
          {modeBtn('/inscription/solo', 'Je m’inscris en solo', 'Le BDE te trouvera une équipe.')}
          {modeBtn('/equipes', 'Je rejoins une équipe', 'Le capitaine de l’équipe valide ta demande.')}
          {modeBtn('/creer-equipe', 'Je crée mon équipe', 'Je deviens capitaine et j’accepte mes coéquipiers.')}
        </>
      )}
    </>
  );
}
