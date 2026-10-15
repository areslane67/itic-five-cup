import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent, useReg } from '../state.jsx';
import { Back, Progress } from '../ui.jsx';

export default function Choose() {
  const nav = useNavigate();
  const { promo, setPromo } = useReg();
  const { event } = useEvent();
  const next = useRef(null);
  const [picked, setPicked] = useState(0);

  // Après le choix de la promo, fait défiler jusqu'à la question suivante
  useEffect(() => {
    if (picked) next.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [picked]);

  const promoBtn = (p, s) => (
    <button className={'opt ' + (promo === p ? 'on' : '')} onClick={() => { setPromo(p); setPicked((n) => n + 1); }}>
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
      {promoBtn('BTS 1', event?.bts1Tagline ?? 'Les challengers')}
      {promoBtn('BTS 2', event?.bts2Tagline ?? 'Les tenants du titre')}
      {promo && (
        <>
          <h2 ref={next} style={{ marginTop: 34, scrollMarginTop: 16 }}>Comment veux-tu participer ?</h2>
          <p className="sub">Choisis l’option qui te correspond.</p>
          {modeBtn('/inscription/solo', 'Je m’inscris en solo', 'Le BDE te trouvera une équipe.')}
          {modeBtn('/equipes', 'Je rejoins une équipe', 'Le capitaine de l’équipe valide ta demande.')}
          {modeBtn('/creer-equipe', 'Je crée mon équipe', 'Je deviens capitaine et j’accepte mes coéquipiers.')}
        </>
      )}
    </>
  );
}
