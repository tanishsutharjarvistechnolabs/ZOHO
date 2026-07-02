import { useEffect } from "react";
import { useAuth } from "../store/AuthContext";

export function ProtectedRoute({ children }) {
  const { user, loading, error, login } = useAuth();

  useEffect(() => {
    if (!loading && !user && !error) {
      login();
    }
  }, [loading, user, error, login]);

  if (loading) return <div>Checking your session...</div>;

  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={login}>Sign in</button>
      </div>
    );
  }

  return user ? children : null;
}
