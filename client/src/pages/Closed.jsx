import { useNavigate } from 'react-router-dom';

export default function Closed() {
  const nav = useNavigate();
  return (
    <>
      <h2>Inscriptions fermées</h2>
      <p className="sub">Le BDE n’accepte plus de préinscriptions pour le moment. Une question ? Passe voir l’équipe du BDE à l’école.</p>
      <button className="btn alt" onClick={() => nav('/')}>Retour à l’accueil</button>
    </>
  );
}
