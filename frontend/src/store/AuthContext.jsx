import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

export const LOGIN_PATH = "/__catalyst/auth/login";

function redirectToLogin() {
  window.location.replace(LOGIN_PATH);
}

function getCatalystAuth() {
  const auth = window.catalyst?.auth;

  if (!auth) {
    throw new Error(
      "Catalyst authentication SDK is unavailable. Run the app through Catalyst CLI or deploy it to Catalyst."
    );
  }

  return auth;
}

function isAuthenticationFailure(err) {
  const code =
    err?.response?.data?.data?.error_code ??
    err?.data?.error_code ??
    err?.error_code;
  const message =
    err?.response?.data?.data?.message ??
    err?.data?.message ??
    err?.message;

  return (
    code === "AUTHENTICATION_FAILURE" ||
    message === "Authentication failed"
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getCatalystAuth().isUserAuthenticated();
      const authenticatedUser = res?.content ?? null;

      if (!authenticatedUser) {
        redirectToLogin();
        return null;
      }

      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (err) {
      setUser(null);

      // Catalyst can return different error shapes for an absent/expired
      // session (including a plain 401). If the auth SDK loaded successfully,
      // a failed current-user check always means the visitor must sign in.
      if (window.catalyst?.auth || isAuthenticationFailure(err)) {
        redirectToLogin();
        return null;
      }

      setError(err instanceof Error ? err.message : "Authentication failed.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(() => {
    redirectToLogin();
  }, []);

  const logout = useCallback(() => {
    getCatalystAuth().signOut(window.location.origin);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, logout, refreshUser }),
    [user, loading, error, login, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
