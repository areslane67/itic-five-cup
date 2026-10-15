import { useNavigate } from 'react-router-dom';
import { store, useEvent } from '../state.jsx';
import { ErrorBox } from '../ui.jsx';

export default function Home() {
  const nav = useNavigate();
  const { event, error, refresh } = useEvent();
  const f = (v) => v || 'À confirmer';
  const manage = store.get('manage');
  const track = store.get('track');
  return (
    <>
      <section className="hero">
        <h1>ITIC<span>Five Cup</span></h1>
        <div className="vs">BTS 1 <i>vs</i> BTS 2</div>
        <p className="sig">Deux promotions. Un seul trophée.</p>
        <div className="facts">
          <div><b>Date</b><span>{f(event?.date)}</span></div>
          <div><b>Lieu</b><span>{f(event?.venue)}</span></div>
          <div><b>Prix</b><span>{f(event?.price)}</span></div>
        </div>
        <button className="btn" onClick={() => nav('/inscription')}>Je m’inscris</button>
        <p className="note">Inscription gratuite — sans compte</p>
      </section>
      {error && <ErrorBox>{error} <button className="link" onClick={refresh}>Réessayer</button></ErrorBox>}
      {manage && <button className="btn alt" style={{ marginBottom: 10 }} onClick={() => nav('/capitaine/' + manage)}>Gérer mon équipe</button>}
      {track && <button className="btn alt" style={{ marginBottom: 10 }} onClick={() => nav('/suivi/' + track)}>Suivre mon inscription</button>}
      <p className="note">Le foot à 5, ça se joue en équipe : seul, avec des potes, ou en capitaine.</p>
    </>
  );
}
