import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext({
  auth: "standalone",
  logout: () => {},
  refreshBilling: () => {},
  showPlanSelection: () => {},
  updateSettings: () => {},
});

export function AuthProvider({ children }) {
  // null = loading, "standalone" = no auth backend, { user, billing, settings } = cloud mode
  const [auth, setAuth] = useState(null);

  const checkAuth = async () => {
    try {
      const res = await fetch("/auth/me");
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setAuth("standalone");
        return;
      }
      const data = await res.json();
      if (!data.user) {
        setAuth({ user: null, billing: null, settings: {} });
        return;
      }
      // User is authenticated — check billing
      let billing = { status: "active" };
      try {
        const bRes = await fetch("/api/billing/status");
        if (bRes.ok) {
          billing = await bRes.json();
        }
      } catch {}
      setAuth({ user: data.user, billing, settings: data.settings || {} });
    } catch {
      setAuth("standalone");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Handle ?billing=success redirect from Stripe — poll for webhook to update status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      // Poll billing status until it's active (webhook may take a moment)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch("/api/billing/status");
          if (res.ok) {
            const billing = await res.json();
            if (billing.status === "active" || attempts > 10) {
              clearInterval(poll);
              setAuth((prev) => (typeof prev === "object" && prev ? { ...prev, billing } : prev));
            }
          }
        } catch {}
      }, 2000);
      return () => clearInterval(poll);
    }
  }, []);

  const logout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    setAuth({ user: null, billing: null, settings: {} });
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

  const showPlanSelection = () => {
    setAuth((prev) => (typeof prev === "object" && prev ? { ...prev, billing: { status: "none" } } : prev));
  };

  const updateSettings = useCallback(async (newSettings) => {
    // Optimistic update
    setAuth((prev) => {
      if (typeof prev !== "object" || !prev) return prev;
      return { ...prev, settings: { ...prev.settings, ...newSettings } };
    });
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const settings = await res.json();
        setAuth((prev) => (typeof prev === "object" && prev ? { ...prev, settings } : prev));
      }
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ auth, logout, refreshBilling, showPlanSelection, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
