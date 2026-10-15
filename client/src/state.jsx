import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const EventCtx = createContext(null);
export const useEvent = () => useContext(EventCtx);

export function EventProvider({ children }) {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      setEvent(await api.getEvent());
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return <EventCtx.Provider value={{ event, error, refresh }}>{children}</EventCtx.Provider>;
}

const RegCtx = createContext(null);
export const useReg = () => useContext(RegCtx);

// État du parcours d'inscription : promotion choisie + résultat de la dernière inscription
export function RegistrationProvider({ children }) {
  const [promo, setPromo] = useState('');
  const [last, setLast] = useState(null);
  return <RegCtx.Provider value={{ promo, setPromo, last, setLast }}>{children}</RegCtx.Provider>;
}

// Liens secrets mémorisés dans ce navigateur (capitaine / suivi de demande)
export const store = {
  get: (k) => { try { return localStorage.getItem('fivecup_' + k) || ''; } catch { return ''; } },
  set: (k, v) => { try { localStorage.setItem('fivecup_' + k, v); } catch { /* stockage indisponible */ } },
};
