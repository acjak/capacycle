import { useState } from "react";
import { useTheme } from "../theme.jsx";
import { useAuth } from "../AuthContext.jsx";
import Logo from "./Logo.jsx";

const SANS = "'DM Sans', system-ui, sans-serif";

export default function BillingGate() {
  const { colors: c } = useTheme();
  const { auth, logout, refreshBilling } = useAuth();
  const [loading, setLoading] = useState(false);

  const billing = auth?.billing;
  const isOwner = auth?.user?.role === "owner";
  const isExpired = billing?.status === "canceled" ||
    (billing?.status === "trialing" && new Date(billing.trialEndsAt) < new Date());

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: SANS, background: c.bg, color: c.text,
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: c.card, border: `1px solid ${c.border}`, borderRadius: 12,
        padding: "48px 40px", textAlign: "center", maxWidth: 420, width: "100%",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.3, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Logo size={26} /> Capacycle</h1>

        {isOwner ? (
          <>
            <p style={{ fontSize: 14, color: c.textSecondary, margin: "8px 0 0" }}>
              {isExpired ? "Your subscription has expired" : "Start your subscription"}
            </p>
            <p style={{ fontSize: 13, color: c.textMuted, margin: "8px 0 32px" }}>
              {isExpired
                ? "Renew to continue using Capacycle with your team."
                : "Get capacity planning for your Linear workspace."}
            </p>
            <button onClick={handleCheckout} disabled={loading} style={{
              background: c.accent, color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 24px", fontSize: 14, fontWeight: 600,
              cursor: loading ? "wait" : "pointer", fontFamily: SANS,
            }}>
              {loading ? "Redirecting..." : isExpired ? "Renew Subscription" : "Start Subscription"}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: c.textSecondary, margin: "8px 0 0" }}>
              Waiting for subscription
            </p>
            <p style={{ fontSize: 13, color: c.textMuted, margin: "8px 0 32px" }}>
              Your workspace owner needs to set up a subscription before your team can use Capacycle.
              Ask them to sign in and activate the plan.
            </p>
          </>
        )}

        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 16 }}>
          <button onClick={refreshBilling} style={{
            background: "transparent", border: "none", color: c.accent,
            fontSize: 12, cursor: "pointer", fontFamily: SANS,
          }}>
            Already subscribed? Refresh
          </button>
          <button onClick={logout} style={{
            background: "transparent", border: "none", color: c.textMuted,
            fontSize: 12, cursor: "pointer", fontFamily: SANS,
          }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
