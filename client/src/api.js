export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'network', 'Connexion impossible. Vérifie ta connexion et réessaie.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data && data.error;
    throw new ApiError(res.status, e?.code, e?.message || 'Une erreur est survenue.', e?.fields);
  }
  return data;
}

const qs = (o) => new URLSearchParams(o).toString();

export const api = {
  getEvent: () => request('/event'),
  listTeams: (promo) => request('/teams?' + qs({ promo })),
  getTeam: (code) => request('/teams/' + encodeURIComponent(code)),
  getCaptain: (token) => request('/captain/' + encodeURIComponent(token)),
  decide: (token, id, action) => request(`/captain/${encodeURIComponent(token)}/requests/${id}/${action}`, { method: 'POST' }),
  getTracking: (token) => request('/tracking/' + encodeURIComponent(token)),
  register: (payload) => request('/registrations', { method: 'POST', body: payload }),
  admin: {
    login: (password) => request('/admin/login', { method: 'POST', body: { password } }),
    logout: () => request('/admin/logout', { method: 'POST' }),
    dashboard: () => request('/admin/dashboard'),
    updateEvent: (patch) => request('/admin/event', { method: 'PATCH', body: patch }),
    assign: (id, teamId) => request('/admin/participants/' + id, { method: 'PATCH', body: { teamId } }),
    cancel: (id) => request('/admin/participants/' + id, { method: 'DELETE' }),
    setTeamClosed: (id, closed) => request('/admin/teams/' + id, { method: 'PATCH', body: { closed } }),
    exportUrl: '/api/admin/export.csv',
  },
};
