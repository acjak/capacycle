import React, { useEffect, useState } from "react";
import { useTheme } from "../theme.jsx";
import Logo from "./Logo.jsx";

const SANS = "'DM Sans', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

function Lightbox({ images, index, onClose, onPrev, onNext, colors: c }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);
  const img = images[index];
  const n = images.length;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "48px 24px", cursor: "zoom-out",
    }}>
      <img src={img.src} alt={img.alt} onClick={(e) => e.stopPropagation()} style={{
        maxWidth: "min(1600px, 96vw)", maxHeight: "calc(100vh - 140px)",
        width: "auto", height: "auto", objectFit: "contain",
        borderRadius: 10, boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
        cursor: "default",
      }} />
      {img.caption && (
        <div style={{
          fontSize: 14, color: "#d8dae0", marginTop: 16, fontFamily: SANS,
          textAlign: "center", maxWidth: 640,
        }}>{img.caption}</div>
      )}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close" style={{
        position: "absolute", top: 16, right: 20,
        background: "rgba(255,255,255,0.1)", border: `1px solid rgba(255,255,255,0.2)`,
        color: "#fff", borderRadius: "50%", width: 40, height: 40,
        cursor: "pointer", fontSize: 20, lineHeight: 1, fontFamily: SANS,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>&times;</button>
      {n > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous" style={{
            position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.1)", border: `1px solid rgba(255,255,255,0.2)`,
            color: "#fff", borderRadius: "50%", width: 44, height: 44,
            cursor: "pointer", fontSize: 22, lineHeight: 1, fontFamily: SANS,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>&#8249;</button>
          <button onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next" style={{
            position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.1)", border: `1px solid rgba(255,255,255,0.2)`,
            color: "#fff", borderRadius: "50%", width: 44, height: 44,
            cursor: "pointer", fontSize: 22, lineHeight: 1, fontFamily: SANS,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>&#8250;</button>
          <div style={{
            position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
            fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: MONO,
          }}>{index + 1} / {n}</div>
        </>
      )}
    </div>
  );
}

function Carousel({ images, colors: c }) {
  const [i, setI] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const n = images.length;
  const go = (next) => setI((prev) => (prev + next + n) % n);
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setLightboxOpen(true)} style={{
        borderRadius: 10, overflow: "hidden",
        border: `1px solid ${c.border}`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
        background: c.card,
        cursor: "zoom-in",
      }}>
        <img src={images[i].src} alt={images[i].alt} style={{ width: "100%", display: "block" }} />
      </div>
      {n > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.55)", border: `1px solid ${c.border}`,
            color: "#fff", borderRadius: "50%", width: 36, height: 36,
            cursor: "pointer", fontSize: 16, lineHeight: 1, fontFamily: SANS,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>&#8249;</button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.55)", border: `1px solid ${c.border}`,
            color: "#fff", borderRadius: "50%", width: 36, height: 36,
            cursor: "pointer", fontSize: 16, lineHeight: 1, fontFamily: SANS,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>&#8250;</button>
          <div onClick={(e) => e.stopPropagation()} style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 6,
            background: "rgba(0,0,0,0.4)", borderRadius: 12, padding: "4px 8px",
          }}>
            {images.map((_, idx) => (
              <button key={idx} onClick={(e) => { e.stopPropagation(); setI(idx); }} aria-label={`Image ${idx + 1}`} style={{
                width: 7, height: 7, borderRadius: "50%",
                border: "none", padding: 0, cursor: "pointer",
                background: idx === i ? "#fff" : "rgba(255,255,255,0.4)",
              }} />
            ))}
          </div>
        </>
      )}
      {images[i].caption && (
        <div style={{
          fontSize: 12, color: c.textMuted, marginTop: 8, fontFamily: SANS,
          fontStyle: "italic", textAlign: "center",
        }}>{images[i].caption}</div>
      )}
      {lightboxOpen && (
        <Lightbox
          images={images}
          index={i}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          colors={c}
        />
      )}
    </div>
  );
}

function FeatureSection({ title, description, images, reverse, colors: c }) {
  return (
    <div style={{
      display: "flex", gap: 40, alignItems: "center",
      flexDirection: reverse ? "row-reverse" : "row",
      padding: "48px 0",
    }}>
      <div style={{ flex: "0 0 55%", maxWidth: "55%" }}>
        <Carousel images={images} colors={c} />
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px", letterSpacing: -0.3 }}>{title}</h3>
        <p style={{ fontSize: 15, color: c.textSecondary, lineHeight: 1.65, margin: 0 }}>{description}</p>
      </div>
    </div>
  );
}

function Stat({ value, label, colors: c }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 32, fontWeight: 700, fontFamily: MONO, color: c.accent }}>{value}</div>
      <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function PricingCard({ name, description, monthlyPrice, annualPrice, features, highlighted, colors: c }) {
  return (
    <div style={{
      background: c.card, border: `1px solid ${highlighted ? c.accent : c.border}`,
      borderRadius: 12, padding: "32px 28px", flex: "1 1 0",
      display: "flex", flexDirection: "column",
      boxShadow: highlighted ? `0 0 24px ${c.accent}15` : "none",
    }}>
      {highlighted && (
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
          color: c.accent, marginBottom: 12,
        }}>Most popular</div>
      )}
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>{description}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 36, fontWeight: 700, fontFamily: MONO }}>${monthlyPrice}</span>
        <span style={{ fontSize: 13, color: c.textMuted }}>/month</span>
      </div>
      <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 24 }}>
        ${annualPrice}/month billed annually
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: c.textSecondary }}>
            <span style={{ color: c.green, flexShrink: 0 }}>&#10003;</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <a href="/auth/login" style={{
        display: "block", textAlign: "center", marginTop: 24,
        background: highlighted ? c.accent : "transparent",
        border: `1px solid ${highlighted ? c.accent : c.border}`,
        borderRadius: 8, padding: "12px 20px", fontSize: 14, fontWeight: 600,
        color: highlighted ? "#fff" : c.textSecondary,
        textDecoration: "none", fontFamily: SANS,
      }}>Start free trial</a>
    </div>
  );
}

function FAQItem({ question, answer, colors: c }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: `1px solid ${c.border}`, padding: "16px 0",
    }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        background: "none", border: "none", cursor: "pointer", width: "100%",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: 0, fontFamily: SANS,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: c.text, textAlign: "left" }}>{question}</span>
        <span style={{ fontSize: 18, color: c.textMuted, flexShrink: 0, marginLeft: 16 }}>{open ? "\u2212" : "+"}</span>
      </button>
      {open && (
        <div style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.6, marginTop: 10 }}>
          {answer}
        </div>
      )}
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

function DemoButton({ colors: c }) {
  return (
    <a href="/demo" onClick={(e) => { e.preventDefault(); window.__showDemo?.(); }} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "transparent", border: `1px solid ${c.border}`, borderRadius: 8,
      padding: "14px 28px", fontSize: 15, fontWeight: 600,
      color: c.textSecondary, textDecoration: "none", fontFamily: SANS,
    }}>Try the demo</a>
  );
}

export default function LoginPage() {
  const { colors: c } = useTheme();

  return (
    <div style={{
      fontFamily: SANS,
      background: `radial-gradient(ellipse 900px 600px at 50% -100px, ${c.accent}26, transparent 70%), radial-gradient(ellipse 700px 500px at 100% 600px, ${c.accent}18, transparent 70%), radial-gradient(ellipse 800px 500px at 0% 1800px, ${c.accent}14, transparent 70%), ${c.bg}`,
      color: c.text,
      minHeight: "100vh", overflowX: "hidden",
    }}>
      {/* Nav */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", maxWidth: 1060, margin: "0 auto",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 8 }}><Logo size={20} /> Capacycle</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="#pricing" style={{ fontSize: 13, color: c.textMuted, textDecoration: "none", fontFamily: SANS }}>Pricing</a>
          <a href="/demo" onClick={(e) => { e.preventDefault(); window.__showDemo?.(); }} style={{
            fontSize: 13, color: c.textMuted, textDecoration: "none", fontFamily: SANS,
          }}>Demo</a>
          <a href="/auth/login" style={{
            background: c.card, border: `1px solid ${c.border}`, borderRadius: 6,
            padding: "6px 14px", fontSize: 12, fontWeight: 500,
            color: c.textSecondary, textDecoration: "none", fontFamily: SANS,
          }}>Sign in</a>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        maxWidth: 1060, margin: "0 auto", padding: "60px 24px 20px",
        textAlign: "center",
      }}>
        <div style={{ marginBottom: 20 }}><Logo size={48} /></div>
        <h1 style={{
          fontSize: 44, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.12,
          margin: 0,
        }}>
          The sprint tools you miss<br />
          <span style={{ color: c.accent }}>now on top of Linear</span>
        </h1>
        <p style={{
          fontSize: 17, color: c.textSecondary, margin: "18px auto 0",
          maxWidth: 620, lineHeight: 1.6,
        }}>
          Capacity planning, burndown, velocity, forecasting, retros. For Scrum Masters and
          Product Owners whose team moved to Linear — but still need the controls they had in
          Azure DevOps or Jira.
        </p>
        <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <CTAButton colors={c}>Get started</CTAButton>
          <DemoButton colors={c} />
        </div>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 10 }}>
          14-day free trial. No credit card required.
        </div>
      </div>

      {/* Hero screenshot */}
      <div style={{
        maxWidth: 900, margin: "32px auto 0", padding: "0 24px",
      }}>
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: `1px solid ${c.border}`,
          boxShadow: `0 8px 40px rgba(0,0,0,0.35), 0 0 80px ${c.accent}22`,
        }}>
          <img
            src="/screenshots/capacity_overview.png"
            alt="Capacycle dashboard showing per-person capacity breakdown"
            style={{ width: "100%", display: "block" }}
          />
        </div>
      </div>

      {/* Coming from ADO/Jira? */}
      <div style={{ maxWidth: 900, margin: "56px auto 0", padding: "0 24px" }}>
        <div style={{
          background: c.card, border: `1px solid ${c.border}`, borderRadius: 12,
          padding: "22px 28px",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2,
            color: c.accent, marginBottom: 12,
          }}>Coming from Azure DevOps or Jira?</div>
          <div style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.65, marginBottom: 14 }}>
            Linear is fast and beautiful — but its planning surface is deliberately minimal.
            Capacycle puts the controls you relied on back in front of you, without leaving Linear.
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 24px",
            fontSize: 13, color: c.textSecondary,
          }}>
            {[
              "Per-person capacity & availability",
              "Sprint burndown with remaining-work line",
              "Historical velocity per cycle",
              "Estimate drift, mid-sprint",
              "Velocity-based project forecasting",
              "Retrospective & planning boards",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: c.green, flexShrink: 0, marginTop: 1 }}>&#10003;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature sections with screenshots */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 0" }}>

        <FeatureSection colors={c}
          title="Capacity planning that reflects who's actually available"
          description="Per-person capacity bars show assigned vs. available hours during planning — not on Wednesday. Red flags overload before it becomes a problem. A simple availability calendar lets you mark days off and half-days; remaining capacity recalculates automatically, so your sprint plan always matches reality."
          images={[
            { src: "/screenshots/capacity_overview.png", alt: "Per-person capacity view with assigned vs. available hours", caption: "Every person, one screen." },
            { src: "/screenshots/capacity_detail_overload.png", alt: "Overloaded team members highlighted in red", caption: "Red bars = over capacity. Catch it during planning." },
            { src: "/screenshots/capacity_availability.png", alt: "Per-person availability calendar for the cycle", caption: "Days off, half-days, hours per day — capacity updates live." },
          ]}
          reverse={false}
        />

        <FeatureSection colors={c}
          title="Burndown with the remaining-work line you expect"
          description="Watch remaining work against the ideal line, with a today marker and hover tooltips for exact values. Toggle between hours and issue count. Underneath, a per-person load breakdown shows who's on track, who's ahead, and who's headed for a crunch."
          images={[
            { src: "/screenshots/burndown_overview.png", alt: "Sprint burndown chart with ideal line", caption: "Remaining work vs. ideal, updated live from Linear." },
            { src: "/screenshots/burndown_detail.png", alt: "Burndown chart with hover values and per-person load table", caption: "Exact values on hover. Per-person load on the same screen." },
          ]}
          reverse={true}
        />

        <FeatureSection colors={c}
          title="Historical velocity, so next sprint's ask is grounded"
          description="A simple bar chart of completed work per cycle, with the running average. Use it in planning when the team pushes back on a stretch commitment — and use it to set expectations with stakeholders. No extension, no configuration; it's calculated from cycle history in Linear."
          images={[
            { src: "/screenshots/velocity_overview.png", alt: "Velocity bar chart of completed work per cycle", caption: "Completed work per cycle, with running average." },
          ]}
          reverse={false}
        />

        <FeatureSection colors={c}
          title="Catch estimate drift before it derails the sprint"
          description="Every issue's estimate flow in one table: original → current, plus every mid-sprint change with a timestamp. Sort by drift to find the biggest movers. Summary stats at the top tell you how much the whole cycle has grown, how many issues were re-estimated, and how many changed after work started."
          images={[
            { src: "/screenshots/estimates_overview.png", alt: "Estimates table with cycle drift summary and per-issue drift", caption: "Cycle drift at a glance. Every re-estimate tracked." },
            { src: "/screenshots/estimates_detail.png", alt: "Estimate changes sorted by drift magnitude", caption: "Sort by drift. Biggest movers float to the top." },
          ]}
          reverse={true}
        />

        <FeatureSection colors={c}
          title="Project & milestone insights, not just ticket stats"
          description="See completion by project and milestone inside each cycle, plus a drift ranking that shows which projects are quietly growing. Pattern detection highlights what your highest-drift issues have in common — so the next sprint doesn't repeat the same surprises."
          images={[
            { src: "/screenshots/insights_overview.png", alt: "Progress by project and milestone", caption: "Roll up by project and milestone." },
            { src: "/screenshots/insights_detail.png", alt: "Drift ranking by project", caption: "Drift ranking: which projects are growing out from under you." },
          ]}
          reverse={false}
        />

        <FeatureSection colors={c}
          title="Forecast when projects will actually ship"
          description="Velocity-based completion estimates for every project, with a second column that adjusts for historical scope change. You get two dates: what the numbers say, and what they say once you account for the fact that estimates keep creeping. Stakeholders get a realistic answer — before they ask."
          images={[
            { src: "/screenshots/forecasting_overview.png", alt: "Scope change per cycle history chart", caption: "How much scope has moved in each past cycle." },
            { src: "/screenshots/forecasting_detail.png", alt: "Per-project completion estimates with drift-adjusted ETA", caption: "Two ETAs per project: raw velocity, and adjusted for drift." },
          ]}
          reverse={true}
        />

        <FeatureSection colors={c}
          title="An async standup view for distributed teams"
          description="One screen, one person at a time: what they completed since yesterday, what's in progress, and what's up next. Great for async standups, for product check-ins, and for the PO who just wants to know where everyone is without pinging six people."
          images={[
            { src: "/screenshots/standup_overview.png", alt: "Standup view with per-person completed, in-progress, and up next", caption: "Yesterday, today, next — for everyone on the team." },
          ]}
          reverse={false}
        />

        <FeatureSection colors={c}
          title="Retros and planning boards, in the same tool"
          description="Multi-column kanban with real-time sync, drag-and-drop, and anonymous dot voting. Choose the Retrospective preset for Went Well / To Improve / Action Items, Planning for the sprint grid, or build your own columns. Everything updates live for the whole team — no separate Miro board, no separate subscription."
          images={[
            { src: "/screenshots/board_overview.png", alt: "Retrospective board with cards in three columns", caption: "Retro preset: Went Well, To Improve, Action Items." },
            { src: "/screenshots/board_detail.png", alt: "Retro board with votes counted on cards", caption: "Anonymous dot voting — see what the team actually wants to talk about." },
          ]}
          reverse={true}
        />
      </div>

      {/* Built for daily use */}
      <div style={{
        maxWidth: 1060, margin: "0 auto", padding: "48px 24px 0",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
            Built for daily use
          </h2>
          <p style={{ fontSize: 14, color: c.textMuted, marginTop: 8 }}>
            Fast enough to pull up mid-standup. Live enough that your team sees the same thing.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            {
              title: "Quick",
              desc: "Tabs switch instantly. Changing cycles, toggling burndown modes, or opening the standup view is a single click — no spinners, no waiting for a fetch.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
            },
            {
              title: "Real-time",
              desc: "Boards and votes sync across every open tab the moment anything changes — perfect for remote retros and planning sessions where half the team is on a call.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.2-8.55" />
                  <polyline points="21 3 21 9 15 9" />
                </svg>
              ),
            },
            {
              title: "Light & dark",
              desc: "Switch themes with a click. Both modes use the same careful typography and color system — pick the one that matches the rest of your screen.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.title} style={{
              background: c.card, border: `1px solid ${c.border}`, borderRadius: 12,
              padding: "24px 24px 22px",
            }}>
              <div style={{ color: c.accent, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.55 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{
        maxWidth: 700, margin: "0 auto", padding: "48px 24px 60px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
            Up and running in 30 seconds
          </h2>
          <p style={{ fontSize: 14, color: c.textMuted, marginTop: 8 }}>
            Connect your Linear workspace. Everything else is automatic.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { step: "1", title: "Sign in with Linear", desc: "One-click OAuth. Read-only access — Capacycle never modifies your workspace." },
            { step: "2", title: "Pick a team and a cycle", desc: "Issues, estimates, assignees, projects, and milestones load instantly. Nothing to configure in Linear." },
            { step: "3", title: "Plan, track, forecast", desc: "Capacity view, burndown, velocity, drift, forecasting, retros — all running on your existing Linear data." },
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
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" style={{
        maxWidth: 760, margin: "0 auto", padding: "60px 24px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
            Simple pricing
          </h2>
          <p style={{ fontSize: 14, color: c.textMuted, marginTop: 8 }}>
            14-day free trial on both plans. No credit card required.
          </p>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <PricingCard colors={c}
            name="Team"
            description="For a single Linear team"
            monthlyPrice={9}
            annualPrice={7}
            highlighted={false}
            features={[
              "One Linear team",
              "All capacity & burndown features",
              "Estimate drift tracking",
              "Insights & forecasting",
              "Collaborative boards",
              "Availability calendar",
            ]}
          />
          <PricingCard colors={c}
            name="Organization"
            description="For your entire Linear workspace"
            monthlyPrice={29}
            annualPrice={23}
            highlighted={true}
            features={[
              "All teams in your workspace",
              "Everything in Team, plus:",
              "Cross-team capacity view",
              "Org-wide project forecasting",
              "Switch between teams instantly",
              "Priority support",
            ]}
          />
        </div>
      </div>

      {/* Trust / Security */}
      <div style={{
        maxWidth: 760, margin: "0 auto", padding: "20px 24px 60px",
      }}>
        <div style={{
          background: c.card, border: `1px solid ${c.border}`, borderRadius: 12,
          padding: "32px 36px",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32,
        }}>
          {[
            {
              icon: "\uD83D\uDD12",
              title: "Read-only access",
              desc: "Capacycle never creates, modifies, or deletes anything in your Linear workspace.",
            },
            {
              icon: "\u2601\uFE0F",
              title: "Your data stays in Linear",
              desc: "We cache data briefly for performance. Nothing is stored permanently outside of Linear.",
            },
            {
              icon: "\uD83D\uDD11",
              title: "OAuth, not passwords",
              desc: "Sign in via Linear's OAuth flow. We never see or store your Linear password.",
            },
          ].map((t) => (
            <div key={t.title}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{t.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{
        maxWidth: 660, margin: "0 auto", padding: "20px 24px 60px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
            Frequently asked questions
          </h2>
        </div>
        <div style={{ borderTop: `1px solid ${c.border}` }}>
          <FAQItem colors={c}
            question="How does Capacycle connect to Linear?"
            answer="You sign in with your Linear account via OAuth. Capacycle gets read-only access to your teams, cycles, issues, and estimates. We never modify anything in your workspace."
          />
          <FAQItem colors={c}
            question="Does it work with any Linear workspace?"
            answer="Yes. Capacycle works with any Linear workspace regardless of plan. It reads your existing teams, cycles, and issues — no setup or configuration in Linear needed."
          />
          <FAQItem colors={c}
            question="What's the difference between the Team and Organization plans?"
            answer="The Team plan covers one Linear team. The Organization plan covers every team in your workspace, so you can switch between them without separate subscriptions."
          />
          <FAQItem colors={c}
            question="Can multiple people on my team use it?"
            answer="Yes. Everyone on the team can sign in with their own Linear account. Boards and votes are shared in real time. Billing is per-workspace, not per-seat."
          />
          <FAQItem colors={c}
            question="Does Capacycle store my data?"
            answer="Capacycle caches your Linear data briefly (minutes) for performance. Issue history is fetched on demand and not stored. Board cards and availability settings are stored in our database. We never store issue content long-term."
          />
          <FAQItem colors={c}
            question="What happens when my trial ends?"
            answer="After 14 days, you'll be asked to pick a plan. No credit card is required to start the trial. If you don't subscribe, you simply lose access — nothing is deleted."
          />
          <FAQItem colors={c}
            question="Can I cancel anytime?"
            answer="Yes. You can cancel from the billing portal at any time. Your subscription stays active until the end of the billing period."
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        textAlign: "center", padding: "48px 24px 60px",
        background: c.card, borderTop: `1px solid ${c.border}`,
      }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 8px", letterSpacing: -0.3 }}>
          Run the sprint, not the spreadsheet
        </h2>
        <p style={{ fontSize: 15, color: c.textSecondary, margin: "0 0 28px", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          Your team's Linear data is already there. Capacycle turns it into the capacity plan,
          burndown, and forecast you actually need.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <CTAButton colors={c}>Start your free trial</CTAButton>
          <DemoButton colors={c} />
        </div>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 10 }}>
          No credit card required. Works with any Linear workspace.
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "20px 24px",
        textAlign: "center", fontSize: 11, color: c.textMuted,
      }}>
        Capacycle &middot; Sprint planning, forecasting, and retros for Linear
        <div style={{ marginTop: 6 }}>
          <a href="/privacy" onClick={(e) => { e.preventDefault(); window.__showLegal?.("privacy"); }}
            style={{ color: c.textMuted, textDecoration: "none", marginRight: 12 }}>Privacy Policy</a>
          <a href="/terms" onClick={(e) => { e.preventDefault(); window.__showLegal?.("terms"); }}
            style={{ color: c.textMuted, textDecoration: "none" }}>Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
