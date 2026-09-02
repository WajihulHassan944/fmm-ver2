import Head from 'next/head';
import Link from 'next/link';

// One of three legal pages (/terms, /privacy, /responsible-play). They share a
// visual shell deliberately: a visitor who lands on one should recognise the
// others as the same set of documents.
const LEGAL_STYLES = `.fmm-legal, .fmm-legal p, .fmm-legal li, .fmm-legal td, .fmm-legal th { color: #201f1d !important; }
    .fmm-legal h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 19pt; margin: 28pt 0 6pt; letter-spacing: .01em; color: #201f1d !important; }
    .fmm-legal h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 13pt; margin: 17pt 0 4pt; color: #201f1d !important; }
    .fmm-legal p, .fmm-legal li { font-family: 'Lora', Georgia, serif; font-size: 10.5pt; line-height: 1.62; text-align: justify; text-wrap: pretty; }
    .fmm-legal li { margin-bottom: 5pt; }
    .fmm-legal ul { padding-left: 18pt; margin: 8pt 0 12pt; }
    .fmm-legal table { width: 100%; border-collapse: collapse; margin: 10pt 0 14pt; font-family: 'Lora', Georgia, serif; font-size: 9.5pt; }
    .fmm-legal th { text-align: left; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 10pt; border-bottom: 1px solid #201f1d; padding: 5pt 8pt 5pt 0; }
    .fmm-legal td { border-bottom: 1px solid rgba(32,31,29,.16); padding: 5pt 8pt 5pt 0; vertical-align: top; }
    .fmm-legal .lede { font-size: 12pt; line-height: 1.55; color: #3d3a36; text-align: left; }`;

const PrivacyPolicy = () => (
  <>
    <Head>
      <title>Privacy Policy · Fantasy MMAdness</title>
      <meta name="description" content="What Fantasy MMAdness collects, why, and what you can ask us to do about it." />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap"
        rel="stylesheet"
      />
    </Head>
    <style jsx global>{LEGAL_STYLES}</style>

    <div style={{ background: '#f3f2f2', minHeight: '100vh', padding: '28px 18px 64px' }}>
      <div className="fmm-legal" style={{ maxWidth: 760, margin: '0 auto', color: '#201f1d' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block', marginBottom: 22, fontFamily: "'Lora', Georgia, serif",
            fontSize: 13, color: '#8a6425', textDecoration: 'none',
            borderBottom: '1px solid rgba(182,130,53,.4)',
          }}
        >
          ← Back to Fantasy MMAdness
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, borderBottom: '1px solid #201f1d', paddingBottom: 7 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>Fantasy MMAdness LLC</div>
          <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 9, color: '#5d5a55' }}>Updated effective 8/27/2026 · Version 1.0</div>
        </div>

        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 34, lineHeight: 1.08, margin: '26px 0 10px' }}>Privacy Policy</h1>

        <p className="lede">
          This explains what we collect, why we collect it, and what you can ask us to do about it.
          We have tried to write it in plain language rather than in the widest terms a lawyer would allow.
        </p>

        <h2>1. What we collect</h2>
        <table>
          <thead>
            <tr><th style={{ width: '30%' }}>What</th><th>Why we need it</th></tr>
          </thead>
          <tbody>
            <tr><td>Name and email</td><td>To create your account, sign you in, and send you contest results, refund and payout notices</td></tr>
            <tr><td>Date of birth</td><td>To confirm you meet the minimum age where you are — 18, or 21 in some states</td></tr>
            <tr><td>State of residence</td><td>To determine whether paid contests are available to you. This is a legal requirement, not a preference</td></tr>
            <tr><td>Phone and postal code</td><td>Optional. Used to verify identity before a payout and to send physical prizes</td></tr>
            <tr><td>Your predictions and results</td><td>To score contests and build leaderboards</td></tr>
            <tr><td>Coin and payment history</td><td>To keep an auditable record of every change to your balance</td></tr>
            <tr><td>Device identifier</td><td>To stop one person claiming a one-per-person reward repeatedly, and to detect duplicate accounts</td></tr>
            <tr><td>Basic technical data</td><td>Browser, screen size and pages visited, so we can fix faults</td></tr>
          </tbody>
        </table>

        <p>
          <strong>We do not store your full card number.</strong> Payments are handled by our payment
          processor; we receive only a confirmation and the last four digits.
        </p>

        <h2>2. What we never do</h2>
        <ul>
          <li>We do not sell your personal information.</li>
          <li>We do not share your email or contact details with other players, with league operators, or with sponsors. A league operator sees your display name and whether you have played — not your email.</li>
          <li>We do not use your data to build advertising profiles for third parties.</li>
        </ul>

        <h2>3. Who we share it with, and why</h2>
        <ul>
          <li><strong>Our payment processor</strong> — to take a payment or send a payout.</li>
          <li><strong>Our email provider</strong> — to deliver the messages you receive from us.</li>
          <li><strong>Our hosting and database providers</strong> — because that is where the service runs.</li>
          <li><strong>Identity or age verification services</strong>, where we are required to confirm who you are before paying you.</li>
          <li><strong>Law enforcement or a regulator</strong>, where we are legally required to.</li>
        </ul>
        <p>
          Where a prize is provided by a sponsor and has to be shipped, we pass on only what is needed
          to deliver it, and we tell you before we do.
        </p>

        <h2>4. How long we keep it</h2>
        <ul>
          <li><strong>While your account is open</strong>, and for as long as we are required to keep financial records afterwards — generally seven years for anything involving money.</li>
          <li><strong>Contest and prediction history</strong> is kept so results remain verifiable.</li>
          <li><strong>If you close your account</strong>, we delete or anonymise what we are not legally required to keep.</li>
          <li><strong>If you self-exclude</strong>, we keep the record of that exclusion for as long as it is in force, because the point of it is that we cannot let you back in early.</li>
        </ul>

        <h2>5. Your choices</h2>
        <ul>
          <li><strong>See your data.</strong> Ask and we will send you what we hold.</li>
          <li><strong>Correct it.</strong> Most of it you can edit in your account settings.</li>
          <li><strong>Delete it.</strong> Ask us to close your account and we will delete what we are not required to keep. We will tell you what has to stay and why.</li>
          <li><strong>Stop the email.</strong> Every non-essential email has an unsubscribe link, and notification settings are in your account. We will still send you messages about money — an entry charge, a refund, a payout — because those are records of your account, not marketing.</li>
        </ul>
        <p>
          Depending on where you live you may have additional rights, including the right not to be
          discriminated against for exercising them. We will not treat you differently for asking.
        </p>

        <h2>6. Children</h2>
        <p>
          The service is not for anyone under 18, and we do not knowingly collect information from
          children. If you believe a minor has created an account, tell us at
          support@fantasymmadness.com and we will close it and delete the data.
        </p>

        <h2>7. Security</h2>
        <p>
          Passwords are stored hashed, never in readable form. Sessions are signed tokens that expire.
          Access to production data is limited to the people who need it. No service can promise it
          will never be breached, and we do not claim otherwise — but if a breach affects you, we will
          tell you.
        </p>

        <h2>8. Changes</h2>
        <p>
          If we change this policy in a way that materially affects you, we will tell you by email or
          when you next sign in, before the change takes effect.
        </p>

        <h2>9. Contact</h2>
        <p style={{ marginBottom: 4 }}>
          Fantasy MMAdness LLC, a Georgia limited liability company<br />
          support@fantasymmadness.com
        </p>
        <p>
          Email is our channel for privacy requests and we monitor it every business day. Where a law
          requires us to provide a postal address, we will do so on request.
        </p>

        <hr style={{ border: 0, borderTop: '1px solid rgba(32,31,29,.16)', margin: '22px 0 0' }} />
        <p style={{ fontSize: 9, color: '#5d5a55', textAlign: 'left', marginTop: 12 }}>
          Updated effective 8/27/2026. Written to describe how Fantasy MMAdness actually handles data.
          It is not legal advice and should be reviewed by a licensed attorney before publication —
          state privacy laws differ, and a few impose specific disclosure wording.
        </p>

      </div>
    </div>
  </>
);

export default PrivacyPolicy;
