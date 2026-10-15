import { Fragment, useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useEvent } from '../state.jsx';
import { Back, ErrorBox, Spinner } from '../ui.jsx';

const MODE = { solo: 'Solo', captain: 'Capitaine', team_member: 'Équipe' };

function Login({ onDone }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(ev) {
    ev.preventDefault();
    setBusy(true);
    try { await api.admin.login(pw); onDone(); }
    catch (ex) { setErr(ex.message); setBusy(false); }
  }
  return (
    <>
      <Back to="/" />
      <h2>Espace BDE</h2>
      <p className="sub">Connexion réservée au BDE.</p>
      <form onSubmit={submit}>
        <label htmlFor="pw">Mot de passe</label>
        <input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <button className="btn" style={{ marginTop: 16 }} disabled={busy || !pw}>Se connecter</button>
      </form>
    </>
  );
}

function EventForm({ event, onSave }) {
  const [v, setV] = useState({ date: event.date, venue: event.venue, price: event.price });
  const [saved, setSaved] = useState(false);
  const field = (k, label, ph) => (
    <>
      <label htmlFor={'ev-' + k}>{label}</label>
      <input id={'ev-' + k} type="text" value={v[k]} placeholder={ph} onChange={(e) => { setV({ ...v, [k]: e.target.value }); setSaved(false); }} />
    </>
  );
  return (
    <>
      <h3 style={{ fontSize: 28, margin: '28px 0 4px' }}>Infos du tournoi</h3>
      {field('date', 'Date', 'Ex. Samedi 14 juin, 14h')}
      {field('venue', 'Lieu', 'Ex. Five de Paris 12e')}
      {field('price', 'Prix', 'Ex. Gratuit')}
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn sm" onClick={async () => { await onSave(v); setSaved(true); }}>Enregistrer</button>
        {saved && <span className="ok-msg">Enregistré ✓</span>}
      </div>
    </>
  );
}

export default function Admin() {
  const { refresh } = useEvent();
  const [auth, setAuth] = useState('loading'); // loading | out | in
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [fp, setFp] = useState('');
  const [openTeam, setOpenTeam] = useState(null); // équipe dont on affiche les joueurs

  const load = useCallback(async () => {
    try { setData(await api.admin.dashboard()); setAuth('in'); }
    catch (ex) { if (ex.status !== 401) setErr(ex.message); setAuth('out'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Exécute une action admin puis recharge le tableau de bord
  const act = (fn) => async (...args) => {
    setErr('');
    try { await fn(...args); await load(); refresh(); }
    catch (ex) { if (ex.status === 401) setAuth('out'); else setErr(ex.message); }
  };

  if (auth === 'loading') return <Spinner />;
  if (auth === 'out') return <><ErrorBox>{err}</ErrorBox><Login onDone={load} /></>;

  const { event, stats, participants, teams } = data;
  const rows = participants.filter(
    (x) => (!fp || x.promo === fp) && (!q || `${x.firstName} ${x.lastName}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <Back to="/" />
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Tableau de bord</h2>
        <button className="link" onClick={async () => { await api.admin.logout(); setAuth('out'); }}>Déconnexion</button>
      </div>
      <ErrorBox>{err}</ErrorBox>

      <div className="stats">
        <div><b>{stats.total}</b><span>Préinscrits</span></div>
        <div><b>{stats.solos}</b><span>Solos à affecter</span></div>
        <div><b>{stats.bts1}</b><span>BTS 1</span></div>
        <div><b>{stats.bts2}</b><span>BTS 2</span></div>
      </div>

      <div className="row">
        <button className={'btn sm ' + (event.registrationsOpen ? '' : 'alt')}
          onClick={act(() => api.admin.updateEvent({ registrationsOpen: !event.registrationsOpen }))}>
          {event.registrationsOpen ? 'Fermer les inscriptions' : 'Rouvrir les inscriptions'}
        </button>
        <span className="tag">{stats.openTeams} équipes ouvertes · {stats.fullTeams} complète(s) · {stats.pending} demande(s) en attente</span>
      </div>

      <EventForm key={`${event.date}|${event.venue}|${event.price}`} event={event} onSave={act((v) => api.admin.updateEvent(v))} />

      <div className="row" style={{ justifyContent: 'space-between', margin: '28px 0 4px' }}>
        <h3 style={{ fontSize: 28 }}>Participants</h3>
        <a className="btn alt sm" href={api.admin.exportUrl}>Exporter en CSV</a>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <input type="text" placeholder="Rechercher" aria-label="Rechercher un participant" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
        <select aria-label="Filtrer par promotion" value={fp} onChange={(e) => setFp(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Toutes promos</option><option>BTS 1</option><option>BTS 2</option>
        </select>
      </div>
      <div className="tw">
        <table>
          <thead><tr><th>Nom</th><th>Promo</th><th>Niveau</th><th>Mode</th><th>Équipe</th><th></th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>{x.firstName} {x.lastName}</td>
                <td>{x.promo}</td>
                <td>{x.level || '—'}</td>
                <td>{x.status === 'pending' ? 'Demande' : MODE[x.mode]}</td>
                <td>
                  {/* Capitaines et demandes en attente : équipe non modifiable ici */}
                  {x.mode === 'captain' || x.status === 'pending' ? x.teamName : (
                    <select aria-label={`Affecter ${x.firstName} ${x.lastName}`} value={x.teamId || ''}
                      onChange={(e) => act(api.admin.assign)(x.id, e.target.value ? Number(e.target.value) : null)}>
                      <option value="">{x.teamId ? 'Retirer (solo)' : 'À affecter…'}</option>
                      {teams.filter((t) => t.promo === x.promo && (t.id === x.teamId || (!t.closed && t.count < t.max))).map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  <button className="team-btn" onClick={() => window.confirm(`Annuler l’inscription de ${x.firstName} ${x.lastName} ?`) && act(api.admin.cancel)(x.id)}>
                    Annuler
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: 28, margin: '28px 0 4px' }}>Équipes</h3>
      <div className="tw">
        <table>
          <thead><tr><th>Équipe</th><th>Promo</th><th>Effectif</th><th>Code</th><th></th></tr></thead>
          <tbody>
            {teams.map((t) => (
              <Fragment key={t.id}>
              <tr>
                <td>
                  <button className="link" style={{ color: 'var(--ink)', fontWeight: 600, padding: 0 }} aria-expanded={openTeam === t.id}
                    onClick={() => setOpenTeam(openTeam === t.id ? null : t.id)}>
                    {openTeam === t.id ? '▾' : '▸'} {t.name}
                  </button>
                </td>
                <td>{t.promo}</td><td>{t.count}/{t.max}</td><td>{t.code}</td>
                <td>
                  <div className="row">
                    <button className="team-btn" onClick={act(() => api.admin.setTeamClosed(t.id, !t.closed))}>
                      {t.closed ? 'Rouvrir' : 'Fermer'}
                    </button>
                    <button className="team-btn" onClick={() => window.prompt('Lien capitaine (à copier) :', `${window.location.origin}/capitaine/${t.manageToken}`)}>
                      Lien capitaine
                    </button>
                  </div>
                </td>
              </tr>
              {openTeam === t.id && (
                <tr>
                  <td colSpan={5}>
                    <div className="recap" style={{ margin: '4px 0 8px' }}>
                      {participants.filter((p) => p.teamId === t.id).map((p) => (
                        <div key={p.id}>
                          <b>{p.firstName} {p.lastName}{p.mode === 'captain' ? ' (capitaine)' : ''}{p.status === 'pending' ? ' (demande en attente)' : ''}</b>
                          <span>{p.level || 'Niveau non renseigné'}</span>
                        </div>
                      ))}
                      {!participants.some((p) => p.teamId === t.id) && <div><span>Aucun joueur</span></div>}
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">Seules les équipes de la même promotion sont proposées à l’affectation.</p>
    </>
  );
}
