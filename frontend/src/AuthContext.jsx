import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // null = loading, "standalone" = no auth backend, { user, billing } = cloud mode
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/auth/me");
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          // Non-JSON response means /auth/me doesn't exist (standalone mode)
          setAuth("standalone");
          return;
        }
        const data = await res.json();
        if (!data.user) {
          setAuth({ user: null, billing: null });
          return;
        }
        // User is authenticated — check billing
        let billing = { status: "active" }; // default if billing endpoint missing
        try {
          const bRes = await fetch("/api/billing/status");
          if (bRes.ok) {
            billing = await bRes.json();
          }
        } catch {}
        setAuth({ user: data.user, billing });
      } catch {
        // Network error or server not running — standalone mode
        setAuth("standalone");
      }
    })();
  }, []);

  const logout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    setAuth({ user: null, billing: null });
  };

  const refreshBilling = async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (res.ok) {
        const billing = await res.json();
        setAuth((prev) => (typeof prev === "object" && prev ? { ...prev, billing } : prev));
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ auth, logout, refreshBilling }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
