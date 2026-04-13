import { useTheme } from "../theme.jsx";
import Logo from "./Logo.jsx";

const SANS = "'DM Sans', system-ui, sans-serif";

function Section({ title, children, colors: c }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function PrivacyContent({ colors: c }) {
  return (
    <>
      <p style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.7, marginBottom: 28 }}>
        Last updated: April 13, 2026. This policy describes how Capacycle collects, uses, and protects your data.
      </p>

      <Section title="1. What we collect" colors={c}>
        <p>When you sign in with Linear, we receive and store:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Your name, email address, and avatar URL from your Linear profile</li>
          <li>Your Linear organization name and ID</li>
          <li>An OAuth access token and refresh token to read data from your Linear workspace</li>
        </ul>
        <p style={{ marginTop: 8 }}>When you use Capacycle, we also store:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Availability calendar data and capacity settings you configure</li>
          <li>Kanban board content (cards, columns, votes)</li>
          <li>Actual hours entries you add to issues</li>
        </ul>
        <p style={{ marginTop: 8 }}>
          We do <strong>not</strong> store your Linear issues, cycles, or project data on our servers. This data is fetched from Linear's API on each request and cached temporarily in server memory (up to 5 minutes).
        </p>
      </Section>

      <Section title="2. How we use your data" colors={c}>
        <ul style={{ paddingLeft: 20 }}>
          <li>To authenticate you and connect to your Linear workspace</li>
          <li>To display capacity planning data from your Linear workspace</li>
          <li>To store your availability and board data so it persists between sessions</li>
          <li>To process payments through Stripe</li>
        </ul>
        <p style={{ marginTop: 8 }}>We do not sell your data, use it for advertising, or share it with third parties beyond what's described here.</p>
      </Section>

      <Section title="3. Third-party services" colors={c}>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Linear</strong> — We use Linear's OAuth and GraphQL API to read your workspace data. We only request read access. Linear's privacy policy applies to data stored in Linear.</li>
          <li><strong>Stripe</strong> — We use Stripe to process payments. Your payment information is handled entirely by Stripe and never touches our servers. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: c.accent }}>Stripe's privacy policy</a>.</li>
          <li><strong>Fly.io</strong> — Our application is hosted on Fly.io infrastructure in the EU (Stockholm, Sweden).</li>
        </ul>
      </Section>

      <Section title="4. Cookies and local storage" colors={c}>
        <p>We use only essential cookies and browser storage:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>Session cookie</strong> — Keeps you signed in. HttpOnly, secure, expires after 30 days.</li>
          <li><strong>localStorage</strong> — Stores your UI preferences (theme, font size, selected team, active tab). Never sent to our servers.</li>
        </ul>
        <p style={{ marginTop: 8 }}>We do not use analytics cookies, tracking pixels, or any third-party cookies. No cookie consent banner is needed because we only use strictly necessary cookies.</p>
      </Section>

      <Section title="5. Data retention" colors={c}>
        <ul style={{ paddingLeft: 20 }}>
          <li>Your account data is retained as long as your account is active</li>
          <li>Linear API data is cached in memory for up to 5 minutes and not persisted</li>
          <li>If you cancel your subscription, your data remains accessible until you request deletion</li>
          <li>You can request complete deletion of your data at any time by contacting us</li>
        </ul>
      </Section>

      <Section title="6. Your rights (GDPR)" colors={c}>
        <p>If you are in the EU/EEA, you have the right to:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Export your data in a portable format</li>
          <li>Object to or restrict processing of your data</li>
        </ul>
        <p style={{ marginTop: 8 }}>To exercise any of these rights, contact us at the email below.</p>
      </Section>

      <Section title="7. Security" colors={c}>
        <p>We protect your data with:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>HTTPS encryption for all connections</li>
          <li>OAuth tokens stored encrypted in our database</li>
          <li>Security headers (Helmet) and rate limiting on sensitive endpoints</li>
          <li>Role-based access control (only workspace owners can manage billing)</li>
        </ul>
      </Section>

      <Section title="8. Contact" colors={c}>
        <p>For privacy-related questions or data requests:</p>
        <p style={{ marginTop: 8 }}>Email: <a href="mailto:privacy@capacycle.com" style={{ color: c.accent }}>privacy@capacycle.com</a></p>
      </Section>
    </>
  );
}

function TermsContent({ colors: c }) {
  return (
    <>
      <p style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.7, marginBottom: 28 }}>
        Last updated: April 13, 2026. By using Capacycle, you agree to these terms.
      </p>

      <Section title="1. Service description" colors={c}>
        <p>Capacycle is a capacity planning tool that connects to your Linear workspace. We provide dashboards, charts, and planning tools based on your Linear data.</p>
      </Section>

      <Section title="2. Account and access" colors={c}>
        <ul style={{ paddingLeft: 20 }}>
          <li>You sign in using your Linear account via OAuth. You must have a valid Linear account.</li>
          <li>The first person from an organization to sign up becomes the workspace owner and is responsible for billing.</li>
          <li>You are responsible for maintaining the security of your account.</li>
        </ul>
      </Section>

      <Section title="3. Subscriptions and billing" colors={c}>
        <ul style={{ paddingLeft: 20 }}>
          <li>New accounts start with a 14-day free trial with full access</li>
          <li>After the trial, a paid subscription is required to continue using the service</li>
          <li>Team plan ($9/month) covers one Linear team; Organization plan ($29/month) covers all teams</li>
          <li>Annual billing is available at a discount</li>
          <li>Payments are processed by Stripe. All prices are in USD.</li>
          <li>You can cancel your subscription at any time through the billing portal. Access continues until the end of the billing period.</li>
          <li>We reserve the right to change pricing with 30 days notice to existing subscribers</li>
        </ul>
      </Section>

      <Section title="4. Acceptable use" colors={c}>
        <p>You agree not to:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Use the service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to the service or its infrastructure</li>
          <li>Interfere with or disrupt the service</li>
          <li>Reverse engineer or decompile the service</li>
          <li>Resell or redistribute access to the service</li>
        </ul>
      </Section>

      <Section title="5. Data and privacy" colors={c}>
        <p>Your use of data is governed by our <a href="/privacy" style={{ color: c.accent }}>Privacy Policy</a>. We access your Linear workspace with read-only permissions through your OAuth token. You can revoke access at any time through Linear's settings.</p>
      </Section>

      <Section title="6. Availability and support" colors={c}>
        <ul style={{ paddingLeft: 20 }}>
          <li>We aim to keep the service available 24/7 but do not guarantee uptime</li>
          <li>We may perform maintenance that temporarily affects availability</li>
          <li>Support is provided via email on a best-effort basis</li>
        </ul>
      </Section>

      <Section title="7. Limitation of liability" colors={c}>
        <p>Capacycle is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to the amount you paid us in the 12 months preceding the claim.</p>
      </Section>

      <Section title="8. Termination" colors={c}>
        <p>Either party may terminate at any time. You can cancel your subscription and stop using the service. We may terminate your access if you violate these terms, with notice where practical. On termination, you can request export or deletion of your data.</p>
      </Section>

      <Section title="9. Changes to terms" colors={c}>
        <p>We may update these terms. Material changes will be communicated via email to workspace owners at least 14 days before taking effect. Continued use after changes constitutes acceptance.</p>
      </Section>

      <Section title="10. Governing law" colors={c}>
        <p>These terms are governed by the laws of Denmark. Disputes will be resolved in the courts of Denmark.</p>
      </Section>

      <Section title="11. Contact" colors={c}>
        <p>Email: <a href="mailto:hello@capacycle.com" style={{ color: c.accent }}>hello@capacycle.com</a></p>
      </Section>
    </>
  );
}

export default function LegalPage({ page, onBack }) {
  const { colors: c } = useTheme();

  return (
    <div style={{
      fontFamily: SANS, background: c.bg, color: c.text,
      minHeight: "100vh", padding: "20px 24px",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 14, color: c.textSecondary, fontFamily: SANS,
          }}>
            <Logo size={20} /> Capacycle
          </button>
          <button onClick={onBack} style={{
            background: c.card, border: `1px solid ${c.border}`, borderRadius: 6,
            padding: "5px 12px", fontSize: 12, color: c.textSecondary,
            cursor: "pointer", fontFamily: SANS,
          }}>
            Back
          </button>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: -0.5 }}>
          {page === "privacy" ? "Privacy Policy" : "Terms of Service"}
        </h1>

        {page === "privacy" ? <PrivacyContent colors={c} /> : <TermsContent colors={c} />}
      </div>
    </div>
  );
}
