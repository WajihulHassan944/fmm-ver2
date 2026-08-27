import Head from 'next/head';
import Link from 'next/link';

// One of three legal pages (/terms, /privacy, /responsible-play). They share a
// visual shell deliberately: a visitor who lands on one should recognise the
// others as the same set of documents.
const LEGAL_STYLES = `.fmm-legal h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 19pt; margin: 28pt 0 6pt; letter-spacing: .01em; }
    .fmm-legal h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 13pt; margin: 17pt 0 4pt; }
    .fmm-legal p, .fmm-legal li { font-family: 'Lora', Georgia, serif; font-size: 10.5pt; line-height: 1.62; text-align: justify; text-wrap: pretty; }
    .fmm-legal li { margin-bottom: 5pt; }
    .fmm-legal ul { padding-left: 18pt; margin: 8pt 0 12pt; }
    .fmm-legal table { width: 100%; border-collapse: collapse; margin: 10pt 0 14pt; font-family: 'Lora', Georgia, serif; font-size: 9.5pt; }
    .fmm-legal th { text-align: left; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 10pt; border-bottom: 1px solid #201f1d; padding: 5pt 8pt 5pt 0; }
    .fmm-legal td { border-bottom: 1px solid rgba(32,31,29,.16); padding: 5pt 8pt 5pt 0; vertical-align: top; }
    .fmm-legal .lede { font-size: 12pt; line-height: 1.55; color: #3d3a36; text-align: left; }`;

const ResponsiblePlay = () => (
  <>
    <Head>
      <title>Responsible Play · Fantasy MMAdness</title>
      <meta name="description" content="Deposit limits, self-exclusion and free confidential help." />
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
          <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 9, color: '#5d5a55' }}>Updated effective 8/27/2026</div>
        </div>

        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 34, lineHeight: 1.08, margin: '26px 0 10px' }}>Responsible Play</h1>

        <p className="lede">
          This is meant to be entertainment. If it stops being that, the tools below are in your
          account settings and they work immediately — you do not have to ask us, and you do not have
          to explain yourself.
        </p>

        <div style={{ border: '1px solid #b68235', borderRadius: 4, padding: '14px 16px', margin: '18px 0 4px', background: '#f6ecdc' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 5 }}>Free, confidential help</div>
          <p style={{ margin: 0, textAlign: 'left' }}>
            <strong>National Council on Problem Gambling</strong> — call or text <strong>1-800-522-4700</strong>,
            or visit <a href="https://www.ncpgambling.org" style={{ color: '#8a6425' }}>ncpgambling.org</a>.
            Available 24 hours a day, and it is not run by us.
          </p>
        </div>

        <h2>Tools you control</h2>

        <h3>Deposit limits</h3>
        <p>
          Set a cap on what you can spend over a period you choose. <strong>Lowering a limit takes
          effect immediately.</strong> Raising one takes effect only after a cooling-off period —
          deliberately, because the moment someone wants to raise a limit is the moment the limit is
          doing its job.
        </p>

        <h3>Self-exclusion</h3>
        <p>
          Close your account to entry and purchase for a period you choose. While you are excluded we
          will not accept an entry or a payment from you, and we will not send you promotional email.
        </p>
        <p>
          <strong>A self-exclusion cannot be lifted early.</strong> Not by asking us, and not by
          support. That is the whole point of it. Entries you had already paid for and that have
          already locked will be scored and paid as normal; anything not yet locked is voided and
          refunded.
        </p>

        <h3>Your own history</h3>
        <p>
          Every entry you have made and every change to your coin balance is visible in your account,
          with dates and amounts. If you are not sure how much you have spent, that page will tell you
          exactly.
        </p>

        <h2>What we do at our end</h2>
        <ul>
          <li><strong>Age checks.</strong> 18 minimum, 21 in Alabama, Arizona, Iowa, Louisiana, Massachusetts and Nebraska.</li>
          <li><strong>State checks.</strong> Paid contests are only available where they are permitted. In Hawaii, Idaho, Montana, Nevada and Washington we run free contests only — no entry fee, and prizes are badges, titles and sponsor prizes rather than money.</li>
          <li><strong>One account per person.</strong> Enforced, so a limit or an exclusion cannot be side-stepped by signing up again.</li>
          <li><strong>We may act first.</strong> If play stops looking responsible, we may apply a limit or exclude an account ourselves.</li>
          <li><strong>No credit.</strong> You cannot borrow from us, and you cannot enter a contest you do not have the coins for.</li>
        </ul>

        <h2>Signs worth taking seriously</h2>
        <ul>
          <li>Spending more than you planned, or more than you can comfortably lose.</li>
          <li>Entering to win money back after a loss.</li>
          <li>Hiding how much you play from people close to you.</li>
          <li>Playing to escape stress, low mood, or boredom rather than for enjoyment.</li>
          <li>Losing interest in things you used to care about.</li>
        </ul>
        <p>
          If more than one of those sounds familiar, use the number above. It is free, it is
          confidential, and you do not have to be in crisis to call it.
        </p>

        <h2>Talking to someone else about it</h2>
        <p>
          If you are worried about a family member or a friend, the same helpline will talk to you.
          You cannot self-exclude on someone else's behalf — the account holder has to do that — but
          you can tell us at support@fantasymmadness.com if you believe an account belongs to someone
          under age, or to someone who has already excluded themselves elsewhere.
        </p>

        <h2>Getting hold of us</h2>
        <p style={{ marginBottom: 4 }}>
          support@fantasymmadness.com — monitored every business day.
        </p>
        <p>
          If you write to us about limits or exclusion, we will act on it before we ask you anything
          else.
        </p>

        <hr style={{ border: 0, borderTop: '1px solid rgba(32,31,29,.16)', margin: '22px 0 0' }} />
        <p style={{ fontSize: 9, color: '#5d5a55', textAlign: 'left', marginTop: 12 }}>
          Updated effective 8/27/2026. The tools described here are built and enforced in the product.
          Several states require specific responsible-play wording and helpline numbers for licensed
          operators — have this reviewed alongside your state registrations.
        </p>

      </div>
    </div>
  </>
);

export default ResponsiblePlay;
