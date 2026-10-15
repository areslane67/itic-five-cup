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
  const [v, setV] = useState({
    date: event.date, venue: event.venue, price: event.price,
    bts1Tagline: event.bts1Tagline, bts2Tagline: event.bts2Tagline,
  });
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
      {field('bts1Tagline', 'Slogan BTS 1', 'Ex. Les challengers')}
      {field('bts2Tagline', 'Slogan BTS 2', 'Ex. Les tenants du titre')}
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
  const [sel, setSel] = useState(() => new Set()); // participants cochés
  const [tsel, setTsel] = useState(() => new Set()); // équipes cochées

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
  // Seules les lignes visibles (recherche / filtre) comptent dans la sélection
  const picked = rows.filter((x) => sel.has(x.id));
  const allPicked = rows.length > 0 && picked.length === rows.length;
  const toggle = (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSel(allPicked ? new Set() : new Set(rows.map((x) => x.id)));
  const tpicked = teams.filter((t) => tsel.has(t.id));
  const allTeams = teams.length > 0 && tpicked.length === teams.length;
  const toggleTeam = (id) => setTsel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const deleteTeams = (list) => {
    const names = list.map((t) => t.name).join(', ');
    const msg = `Supprimer définitivement ${list.length > 1 ? `ces ${list.length} équipes` : 'l’équipe'} : ${names} ?

` +
      'Les joueurs (capitaine compris) redeviendront solos à affecter, les demandes en attente seront refusées.';
    if (!window.confirm(msg)) return;
    act(async () => { await api.admin.deleteTeams(list.map((t) => t.id)); setTsel(new Set()); })();
  };
  const cancelPicked = () => {
    const captains = picked.filter((x) => x.mode === 'captain').length;
    const msg = `Supprimer ${picked.length} inscription(s) ?` +
      (captains ? `

Attention : ${captains} capitaine(s) sélectionné(s), leur équipe restera sans capitaine.` : '');
    if (!window.confirm(msg)) return;
    act(async () => { await api.admin.cancelMany(picked.map((x) => x.id)); setSel(new Set()); })();
  };

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

      <EventForm key={`${event.date}|${event.venue}|${event.price}|${event.bts1Tagline}|${event.bts2Tagline}`} event={event} onSave={act((v) => api.admin.updateEvent(v))} />

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
      <div className="row" style={{ marginTop: 10, minHeight: 40 }}>
        <span className="tag">{picked.length} sélectionné(s)</span>
        <button className="btn alt sm" disabled={!picked.length} onClick={cancelPicked}>Supprimer la sélection</button>
        {picked.length > 0 && <button className="link" onClick={() => setSel(new Set())}>Tout désélectionner</button>}
      </div>
      <div className="tw">
        <table>
          <thead><tr>
            <th className="cb"><input type="checkbox" aria-label="Tout sélectionner" checked={allPicked}
              ref={(el) => { if (el) el.indeterminate = picked.length > 0 && !allPicked; }} onChange={toggleAll} /></th>
            <th>Nom</th><th>Promo</th><th>Niveau</th><th>Mode</th><th>Équipe</th><th></th>
          </tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td className="cb"><input type="checkbox" aria-label={`Sélectionner ${x.firstName} ${x.lastName}`}
                  checked={sel.has(x.id)} onChange={() => toggle(x.id)} /></td>
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
      <div className="row" style={{ marginTop: 10, minHeight: 40 }}>
        <span className="tag">{tpicked.length} sélectionnée(s)</span>
        <button className="btn alt sm" disabled={!tpicked.length} onClick={() => deleteTeams(tpicked)}>Supprimer la sélection</button>
        {tpicked.length > 0 && <button className="link" onClick={() => setTsel(new Set())}>Tout désélectionner</button>}
      </div>
      <div className="tw">
        <table>
          <thead><tr>
            <th className="cb"><input type="checkbox" aria-label="Sélectionner toutes les équipes" checked={allTeams}
              ref={(el) => { if (el) el.indeterminate = tpicked.length > 0 && !allTeams; }}
              onChange={() => setTsel(allTeams ? new Set() : new Set(teams.map((t) => t.id)))} /></th>
            <th>Équipe</th><th>Promo</th><th>Effectif</th><th>Code</th><th></th></tr></thead>
          <tbody>
            {teams.map((t) => (
              <Fragment key={t.id}>
              <tr>
                <td className="cb"><input type="checkbox" aria-label={`Sélectionner ${t.name}`}
                  checked={tsel.has(t.id)} onChange={() => toggleTeam(t.id)} /></td>
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
                    <button className="team-btn" onClick={() => deleteTeams([t])}>Supprimer</button>
                  </div>
                </td>
              </tr>
              {openTeam === t.id && (
                <tr>
                  <td colSpan={6}>
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
