import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./theme.jsx";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import LoginPage from "./components/LoginPage.jsx";
import BillingGate from "./components/BillingGate.jsx";

function Root() {
  const { auth } = useAuth();

  // Loading auth state
  if (auth === null) return null;

  // Standalone mode — no auth backend, render app directly
  if (auth === "standalone") return <App />;

  // Cloud mode — not logged in
  if (!auth.user) return <LoginPage />;

  // Cloud mode — no active subscription
  const { billing } = auth;
  if (!billing || billing.status === "none" || billing.status === "canceled" ||
      (billing.status === "trialing" && new Date(billing.trialEndsAt) < new Date())) {
    return <BillingGate />;
  }

  // Cloud mode — authenticated and subscribed
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
