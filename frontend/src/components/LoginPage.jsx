import { useTheme } from "../theme.jsx";
import Logo from "./Logo.jsx";

const SANS = "'DM Sans', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

function FeatureCard({ icon, title, description, colors: c }) {
  return (
    <div style={{
      background: c.card, border: `1px solid ${c.border}`, borderRadius: 10,
      padding: "24px 20px", textAlign: "left",
    }}>
      <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5 }}>{description}</div>
    </div>
  );
}

function PainPoint({ number, pain, solution, colors: c }) {
  return (
    <div style={{
      display: "flex", gap: 16, alignItems: "flex-start",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: c.accentBg, border: `1px solid ${c.accent}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: c.accent, fontFamily: MONO,
      }}>
        {number}
      </div>
      <div>
        <div style={{ fontSize: 14, color: c.red, fontWeight: 600, marginBottom: 4 }}>{pain}</div>
        <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5 }}>{solution}</div>
      </div>
    </div>
  );
}

function CTAButton({ children, colors: c }) {
  return (
    <a href="/auth/login" style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: c.accent, color: "#fff", border: "none", borderRadius: 8,
      padding: "14px 28px", fontSize: 15, fontWeight: 600,
      cursor: "pointer", fontFamily: SANS, textDecoration: "none",
    }}>
      <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
        <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm21.3 71.3c-1 1-2.4 1.6-3.8 1.6H32.5c-1.4 0-2.8-.6-3.8-1.6s-1.6-2.4-1.6-3.8V32.5c0-1.4.6-2.8 1.6-3.8s2.4-1.6 3.8-1.6h35c1.4 0 2.8.6 3.8 1.6s1.6 2.4 1.6 3.8v35c0 1.4-.6 2.8-1.6 3.8z" fill="currentColor"/>
      </svg>
      {children}
    </a>
  );
}

export default function LoginPage() {
  const { colors: c } = useTheme();

  return (
    <div style={{
      fontFamily: SANS, background: c.bg, color: c.text,
      minHeight: "100vh", overflowX: "hidden",
    }}>
      {/* Nav */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", maxWidth: 960, margin: "0 auto",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 8 }}><Logo size={20} /> Capacycle</div>
        <a href="/auth/login" style={{
          background: c.card, border: `1px solid ${c.border}`, borderRadius: 6,
          padding: "6px 14px", fontSize: 12, fontWeight: 500,
          color: c.textSecondary, textDecoration: "none", fontFamily: SANS,
        }}>
          Sign in
        </a>
      </div>

      {/* Hero */}
      <div style={{
        maxWidth: 960, margin: "0 auto", padding: "60px 24px 40px",
        textAlign: "center",
      }}>
        <div style={{ marginBottom: 20 }}><Logo size={48} /></div>
        <h1 style={{
          fontSize: 40, fontWeight: 700, letterSpacing: -1, lineHeight: 1.15,
          margin: 0,
        }}>
          Stop guessing if your<br />
          <span style={{ color: c.accent }}>sprint will actually land</span>
        </h1>
        <p style={{
          fontSize: 16, color: c.textSecondary, margin: "16px auto 0",
          maxWidth: 540, lineHeight: 1.6,
        }}>
          Capacycle connects to your Linear workspace and shows you exactly who
          has capacity, who's overloaded, and whether you'll hit your cycle goals.
        </p>
        <div style={{ marginTop: 32 }}>
          <CTAButton colors={c}>Get started with Linear</CTAButton>
          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 10 }}>
            14-day free trial. No credit card required.
          </div>
        </div>
      </div>

      {/* Screenshot */}
      <div style={{
        maxWidth: 800, margin: "20px auto 0", padding: "0 24px",
      }}>
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: `1px solid ${c.border}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
        }}>
          <img
            src="/screenshot.png"
            alt="Capacycle dashboard showing per-person capacity, availability calendar, and issue breakdown"
            style={{ width: "100%", display: "block" }}
          />
        </div>
      </div>

      {/* Pain points */}
      <div style={{
        maxWidth: 620, margin: "0 auto", padding: "80px 24px 20px",
      }}>
        <div style={{
          textAlign: "center", marginBottom: 40,
        }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
            Sound familiar?
          </h2>
          <p style={{ fontSize: 14, color: c.textMuted, marginTop: 8 }}>
            Sprint planning problems that keep coming back.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <PainPoint colors={c} number="1"
            pain="Someone's overloaded and nobody noticed until Wednesday"
            solution="Capacycle shows per-person capacity bars the moment you open it. Red means overloaded. You see it before standup, not after."
          />
          <PainPoint colors={c} number="2"
            pain="Half the issues don't have estimates, but you planned the sprint anyway"
            solution="The summary strip counts unestimated issues in yellow. Hard to ignore a big yellow number staring at you during planning."
          />
          <PainPoint colors={c} number="3"
            pain="Estimates quietly changed mid-sprint and the burndown looks wrong"
            solution="Estimate drift tracking shows you exactly which issues changed, when, and by how much. No more phantom scope creep."
          />
          <PainPoint colors={c} number="4"
            pain="Someone's on vacation but still has 20 points assigned"
            solution="The availability calendar lets you mark days off per person. Capacity auto-adjusts so you plan against actual working days."
          />
          <PainPoint colors={c} number="5"
            pain="You built a spreadsheet to track capacity, again"
            solution="Capacycle reads directly from Linear. No exports, no formulas, no copy-paste. Open it and the data is already there."
          />
        </div>
      </div>

      {/* Features grid */}
      <div style={{
        maxWidth: 960, margin: "0 auto", padding: "60px 24px",
      }}>
        <div style={{
          textAlign: "center", marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
            Everything you need for sprint planning
          </h2>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}>
          <FeatureCard colors={c}
            icon={<span style={{ color: c.accent }}>&#9632;&#9632;&#9632;</span>}
            title="Per-person capacity"
            description="See assigned vs. available hours for every team member. Spot overloads at a glance."
          />
          <FeatureCard colors={c}
            icon={<span style={{ color: c.green }}>&#9698;</span>}
            title="Burndown & velocity"
            description="Track remaining work against the ideal line. See daily completion velocity with trends."
          />
          <FeatureCard colors={c}
            icon={<span style={{ color: c.yellow }}>&#9881;</span>}
            title="Estimate drift"
            description="Catch when estimates change mid-cycle. Track actual vs. estimated hours per issue."
          />
          <FeatureCard colors={c}
            icon={<span style={{ color: c.accent }}>&#9783;</span>}
            title="Kanban boards"
            description="Collaborative boards for retros and planning. Real-time sync with anonymous voting."
          />
          <FeatureCard colors={c}
            icon={<span style={{ color: c.green }}>&#128197;</span>}
            title="Availability calendar"
            description="Mark days off and half-days. Capacity auto-adjusts so your sprint plan stays realistic."
          />
          <FeatureCard colors={c}
            icon={<span style={{ color: c.yellow }}>&#9889;</span>}
            title="Live from Linear"
            description="Reads directly from your workspace. No data entry, no sync, no stale spreadsheets."
          />
        </div>
      </div>

      {/* How it works */}
      <div style={{
        maxWidth: 620, margin: "0 auto", padding: "20px 24px 60px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
            Up and running in 30 seconds
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { step: "1", title: "Connect Linear", desc: "Sign in with your Linear account. We only need read access." },
            { step: "2", title: "Pick your team", desc: "Select the team and cycle. Everything loads instantly from Linear." },
            { step: "3", title: "See your capacity", desc: "Per-person workload, burndown charts, and estimates. All live." },
          ].map((s) => (
            <div key={s.step} style={{
              display: "flex", gap: 14, alignItems: "flex-start",
              background: c.card, border: `1px solid ${c.border}`, borderRadius: 10,
              padding: "18px 20px",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: c.accent, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, fontFamily: MONO,
              }}>
                {s.step}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: c.textSecondary }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        textAlign: "center", padding: "40px 24px 60px",
        background: c.card, borderTop: `1px solid ${c.border}`,
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", letterSpacing: -0.3 }}>
          Stop flying blind on sprint capacity
        </h2>
        <p style={{ fontSize: 14, color: c.textSecondary, margin: "0 0 24px" }}>
          Your team's Linear data is already there. Capacycle just makes it useful.
        </p>
        <CTAButton colors={c}>Start your free trial</CTAButton>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 10 }}>
          No credit card required. Works with any Linear workspace.
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "20px 24px",
        textAlign: "center", fontSize: 11, color: c.textMuted,
      }}>
        Capacycle &middot; Capacity planning for Linear
      </div>
    </div>
  );
}
