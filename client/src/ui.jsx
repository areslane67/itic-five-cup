import { useNavigate } from 'react-router-dom';

export const Back = ({ to }) => {
  const nav = useNavigate();
  return <button className="link" onClick={() => nav(to)}>← Retour</button>;
};

export const Progress = ({ step }) => (
  <div className="prog"><i style={{ width: `${(step / 3) * 100}%` }} /></div>
);

export const Spinner = ({ label = 'Chargement' }) => <div className="spin" role="status" aria-label={label} />;

export const ErrorBox = ({ children }) => children ? <div className="toast" role="alert">{children}</div> : null;
