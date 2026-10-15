import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useEvent, useReg } from '../state.jsx';
import { Back, ErrorBox, Progress, Spinner } from '../ui.jsx';

const FIELD_MAP = { firstName: 'f', lastName: 'l', className: 'cl', level: 'lv', contact: 'ct', consent: 'ok', teamName: 'tn' };

export default function FormPage({ backTo, title, sub, step, kind, promo, extra, withTeam = false, submitLabel = 'Valider mon inscription' }) {
  const nav = useNavigate();
  const { setLast } = useReg();
  const { refresh } = useEvent();
  const [d, setD] = useState({ f: '', l: '', cl: '', lv: '', ct: '', ok: false, tn: '', ts: 5 });
  const [e, setE] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));

  // En cas d'erreur, fait défiler jusqu'à la première et place le curseur dans le champ concerné
  useEffect(() => {
    if (!Object.keys(e).length) return;
    const el = document.querySelector('main .toast, main .err');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const field = el.previousElementSibling;
    if (field?.matches('input[type=text], select')) field.focus({ preventScroll: true });
  }, [e]);

  async function submit() {
    const err = {};
    if (withTeam && d.tn.trim().length < 2) err.tn = 'Donne un nom à ton équipe (2 caractères minimum).';
    if (!d.f.trim()) err.f = 'Indique ton prénom.';
    if (!d.l.trim()) err.l = 'Indique ton nom.';
    if (!d.ok) err.ok = 'Coche la case pour continuer.';
    setE(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      const res = await api.register({
        kind, promo, firstName: d.f, lastName: d.l, className: d.cl, level: d.lv, contact: d.ct,
        consent: true, ...(withTeam ? { teamName: d.tn.trim(), teamSize: d.ts } : {}), ...extra,
      });
      setLast(res);
      nav('/confirmation');
    } catch (ex) {
      setBusy(false);
      if (ex.code === 'closed') { refresh(); return nav('/inscriptions-fermees', { replace: true }); }
      const m = {};
      if (ex.code === 'duplicate') m.dup = ex.message;
      else if (ex.code === 'team_name_taken') m.tn = ex.message;
      else if (ex.fields && Object.keys(ex.fields).some((k) => FIELD_MAP[k])) {
        for (const [k, v] of Object.entries(ex.fields)) if (FIELD_MAP[k]) m[FIELD_MAP[k]] = v;
      } else m.net = ex.message;
      setE(m);
    }
  }

  if (busy) return <Spinner label="Enregistrement en cours" />;

  const input = (id, label, k, ph) => (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" value={d[k]} placeholder={ph} onChange={(ev) => set(k, ev.target.value)} />
      {e[k] && <p className="err">{e[k]}</p>}
    </>
  );

  return (
    <>
      <Back to={backTo} />
      <Progress step={step} />
      <h2>{title}</h2>
      <p className="sub">{sub} Promotion : <b>{promo}</b>.</p>
      <ErrorBox>{e.dup}</ErrorBox>
      <ErrorBox>{e.net}</ErrorBox>
      {withTeam && (
        <>
          <label htmlFor="tn">Nom de l’équipe *</label>
          <input id="tn" type="text" maxLength={30} value={d.tn} placeholder="Ex. Les Titans" onChange={(ev) => set('tn', ev.target.value)} />
          {e.tn && <p className="err">{e.tn}</p>}
          <label>Nombre de joueurs prévus</label>
          <div className="sizes">
            {[5, 6, 7, 8].map((n) => (
              <button key={n} type="button" className={d.ts === n ? 'on' : ''} onClick={() => set('ts', n)}>{n}</button>
            ))}
          </div>
          <h3 style={{ fontSize: 28, margin: '30px 0 0' }}>Tes infos de capitaine</h3>
        </>
      )}
      {input('fn', 'Prénom *', 'f', 'Ton prénom')}
      {input('ln', 'Nom *', 'l', 'Ton nom')}
      {input('cl', 'Classe (facultatif)', 'cl', 'Ex. SIO2 A')}
      <label htmlFor="lv">Niveau de jeu (facultatif)</label>
      <select id="lv" value={d.lv} onChange={(ev) => set('lv', ev.target.value)}>
        <option value="">Je ne sais pas</option>
        {['Loisir', 'Intermédiaire', 'Compétition'].map((x) => <option key={x}>{x}</option>)}
      </select>
      {input('ct', 'E-mail ou téléphone (facultatif)', 'ct', 'Pour recevoir les infos pratiques')}
      <label className="chk" style={{ margin: '20px 0' }}>
        <input type="checkbox" checked={d.ok} onChange={(ev) => set('ok', ev.target.checked)} />
        J’accepte que le BDE utilise ces données pour organiser le tournoi. Elles ne sont jamais affichées publiquement.
      </label>
      {e.ok && <p className="err" style={{ marginTop: -12 }}>{e.ok}</p>}
      <button className="btn" onClick={submit}>{submitLabel}</button>
    </>
  );
}
