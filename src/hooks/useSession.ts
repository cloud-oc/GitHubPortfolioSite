import { useCallback, useEffect, useState } from "react";
import { fetchSession, logout as requestLogout, startLogin } from "../api/admin";
import type { AdminSession, SessionState } from "../types";

export function useSession(): SessionState {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [status, setStatus] = useState<SessionState["status"]>("idle");

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      setSession(await fetchSession());
      setStatus("ready");
    } catch {
      setSession(null);
      setStatus("error");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await requestLogout();
    setSession(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    session,
    status,
    refresh,
    login: startLogin,
    logout: handleLogout
  };
}
