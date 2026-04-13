import { useState, useEffect } from "react";
import { useTheme } from "../theme.jsx";
import { useAuth } from "../AuthContext.jsx";
import { fetchTeams } from "../api.js";
import Logo from "./Logo.jsx";

const SANS = "'DM Sans', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

function PlanCard({ name, monthlyPrice, annualPrice, description, selected, billingCycle, onSelect, colors: c }) {
  const perMonth = billingCycle === "annual" ? Math.round(annualPrice / 12 * 100) / 100 : monthlyPrice;

  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? c.accentBg : c.bg,
        border: `2px solid ${selected ? c.accent : c.border}`,
        borderRadius: 10, padding: "20px 18px", cursor: "pointer",
        flex: 1, minWidth: 160,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 13, color: c.textSecondary, marginBottom: 12 }}>{description}</div>
      <div style={{ fontFamily: MONO }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: selected ? c.accent : c.text }}>
          ${perMonth}
        </span>
        <span style={{ fontSize: 12, color: c.textMuted }}>/mo</span>
      </div>
      {billingCycle === "annual" && (
        <div style={{ fontSize: 11, color: c.green, marginTop: 4 }}>
          ${annualPrice}/yr — save {Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)}%
        </div>
      )}
    </div>
  );
}

export default function BillingGate() {
  const { colors: c } = useTheme();
  const { auth, logout, refreshBilling } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("team");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const billing = auth?.billing;
  const isOwner = auth?.user?.role === "owner";
  const isExpired = billing?.status === "canceled" ||
    (billing?.status === "trialing" && new Date(billing.trialEndsAt) < new Date());

  // Fetch teams when team plan is selected
  useEffect(() => {
    if (selectedPlan === "team" && teams.length === 0) {
      setTeamsLoading(true);
      fetchTeams().then((data) => {
        const nodes = data.teams?.nodes || [];
        setTeams(nodes);
        if (nodes.length === 1) setSelectedTeamId(nodes[0].id);
      }).catch(() => {}).finally(() => setTeamsLoading(false));
    }
  }, [selectedPlan]);

  const handleCheckout = async () => {
    const planKey = `${selectedPlan}_${billingCycle === "annual" ? "annual" : "monthly"}`;
    if (selectedPlan === "team" && !selectedTeamId) return;
    setLoading(true);
    try {
      const body = { plan: planKey };
      if (selectedPlan === "team") body.teamId = selectedTeamId;
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
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
        padding: "40px 36px", textAlign: "center", maxWidth: 520, width: "100%",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.3, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Logo size={26} /> Capacycle
        </h1>

        {isOwner ? (
          <>
            <p style={{ fontSize: 14, color: c.textSecondary, margin: "8px 0 0" }}>
              {isExpired ? "Your subscription has expired" : "Choose your plan"}
            </p>
            <p style={{ fontSize: 13, color: c.textMuted, margin: "8px 0 20px" }}>
              14-day free trial included. Cancel anytime.
            </p>

            {/* Billing cycle toggle */}
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 20 }}>
              {["monthly", "annual"].map((cycle) => (
                <button key={cycle} onClick={() => setBillingCycle(cycle)} style={{
                  background: billingCycle === cycle ? c.accentBg : "transparent",
                  border: `1px solid ${billingCycle === cycle ? c.accent : c.border}`,
                  borderRadius: 6, padding: "5px 14px", fontSize: 12,
                  color: billingCycle === cycle ? c.accent : c.textMuted,
                  cursor: "pointer", fontFamily: SANS, textTransform: "capitalize",
                }}>
                  {cycle}{cycle === "annual" ? " (save ~22%)" : ""}
                </button>
              ))}
            </div>

            {/* Plan cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, textAlign: "left" }}>
              <PlanCard
                name="Team"
                description="One Linear team"
                monthlyPrice={9}
                annualPrice={84}
                selected={selectedPlan === "team"}
                billingCycle={billingCycle}
                onSelect={() => setSelectedPlan("team")}
                colors={c}
              />
              <PlanCard
                name="Organization"
                description="All teams in your org"
                monthlyPrice={29}
                annualPrice={276}
                selected={selectedPlan === "org"}
                billingCycle={billingCycle}
                onSelect={() => setSelectedPlan("org")}
                colors={c}
              />
            </div>

            {/* Team picker for team plan */}
            {selectedPlan === "team" && (
              <div style={{ marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>
                  Select which team to subscribe:
                </div>
                {teamsLoading ? (
                  <div style={{ fontSize: 12, color: c.textMuted }}>Loading teams...</div>
                ) : (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {teams.map((t) => (
                      <button key={t.id} onClick={() => setSelectedTeamId(t.id)} style={{
                        background: selectedTeamId === t.id ? c.accentBg : c.bg,
                        border: `1px solid ${selectedTeamId === t.id ? c.accent : c.border}`,
                        borderRadius: 6, padding: "6px 14px", fontSize: 13,
                        color: selectedTeamId === t.id ? c.accent : c.textSecondary,
                        cursor: "pointer", fontFamily: SANS,
                      }}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || (selectedPlan === "team" && !selectedTeamId)}
              style={{
                background: (selectedPlan === "team" && !selectedTeamId) ? c.border : c.accent,
                color: "#fff", border: "none", borderRadius: 8,
                padding: "12px 28px", fontSize: 14, fontWeight: 600,
                cursor: loading ? "wait" : (selectedPlan === "team" && !selectedTeamId) ? "not-allowed" : "pointer",
                fontFamily: SANS, width: "100%",
              }}
            >
              {loading ? "Redirecting to checkout..." : `Start free trial — ${selectedPlan === "team" ? "Team" : "Organization"}`}
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

        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 16 }}>
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
        <div style={{ marginTop: 16, fontSize: 11, color: c.textMuted }}>
          <a href="/privacy" onClick={(e) => { e.preventDefault(); window.__showLegal?.("privacy"); }}
            style={{ color: c.textMuted, textDecoration: "none", marginRight: 12 }}>Privacy</a>
          <a href="/terms" onClick={(e) => { e.preventDefault(); window.__showLegal?.("terms"); }}
            style={{ color: c.textMuted, textDecoration: "none" }}>Terms</a>
        </div>
      </div>
    </div>
  );
}
