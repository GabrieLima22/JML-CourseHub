import { useState, useEffect } from "react";

export interface AdminUser {
  username: string;
  loginTime: number;
  sessionExpiry: number;
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  // Verificar sessão existente ao montar
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    const session = localStorage.getItem('jml_admin_session');
    const loginTime = localStorage.getItem('jml_admin_login_time');

    if (session === 'authenticated' && loginTime) {
      const loginTimestamp = parseInt(loginTime);
      const now = Date.now();
      const sessionDuration = 8 * 60 * 60 * 1000; // 8 horas
      const sessionExpiry = loginTimestamp + sessionDuration;

      if (now < sessionExpiry) {
        setIsAuthenticated(true);
        setUser({
          username: "admin26JML",
          loginTime: loginTimestamp,
          sessionExpiry
        });
        return true;
      } else {
        // Sessão expirada
        logout();
        return false;
      }
    }
    return false;
  };

  const login = () => {
    setIsAuthenticated(true);
    const now = Date.now();
    setUser({
      username: "admin26JML",
      loginTime: now,
      sessionExpiry: now + (8 * 60 * 60 * 1000)
    });
  };

  const logout = () => {
    localStorage.removeItem('jml_admin_session');
    localStorage.removeItem('jml_admin_login_time');
    setIsAuthenticated(false);
    setUser(null);
  };

  const getTimeRemaining = (): number => {
    if (!user) return 0;
    return Math.max(0, user.sessionExpiry - Date.now());
  };

  const getTimeRemainingFormatted = (): string => {
    const remaining = getTimeRemaining();
    if (remaining === 0) return "Expirado";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const extendSession = () => {
    if (user) {
      const now = Date.now();
      const newExpiry = now + (8 * 60 * 60 * 1000);
      localStorage.setItem('jml_admin_login_time', now.toString());
      setUser({ ...user, sessionExpiry: newExpiry });
    }
  };

  return {
    isAuthenticated,
    user,
    login,
    logout,
    checkSession,
    getTimeRemaining,
    getTimeRemainingFormatted,
    extendSession
  };
}
