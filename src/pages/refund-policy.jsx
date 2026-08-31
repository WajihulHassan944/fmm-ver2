import Head from 'next/head';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

// Written to match what the platform actually does. If the code changes, this
// page must change with it — a published policy that contradicts the system is
// worse than no policy at all.
export default function RefundPolicy() {
  const updated = 'August 2026';

  return (
    <>
      <Head>
        <title>Refund Policy | Fantasy MMAdness</title>
        <meta
          name="description"
          content="Fantasy MMAdness refund policy for FM coin purchases, contest entries, FM+ memberships and affiliate payouts."
        />
      </Head>

      <main className="fmm-legal-page">
        <div className="fmm-legal-shell">
          <Link href="/" className="fmm-legal-back"><FaArrowLeft aria-hidden="true" /> Back home</Link>

          <h1>Refund Policy</h1>
          <p className="fmm-legal-updated">Last updated: {updated}</p>

          <p className="fmm-legal-lead">
            This policy explains when money and FM coins are returned. It reflects how the
            platform actually works. If anything here is unclear, contact support before
            you buy or enter a contest.
          </p>

          <h2>1. FM coin purchases</h2>
          <p>
            FM coins are a virtual currency used to enter contests on Fantasy MMAdness. They
            have no cash value, cannot be exchanged for money, and cannot be transferred
            between accounts.
          </p>
          <p>
            <strong>Unused coins.</strong> If you bought coins and have not spent any of
            them, contact support within <strong>14 days</strong> of purchase and we will
            refund that purchase to your original payment method. Once coins have been used
            to enter a contest, that purchase is no longer refundable.
          </p>
          <p>
            <strong>Failed or duplicate charges.</strong> If you were charged and no coins
            appeared, or you were charged more than once for the same order, contact support
            with your order number. We will investigate and refund any duplicate or failed
            charge in full. Our checkout uses idempotency keys specifically to prevent double
            charging, but if one occurs it is our error and we will correct it.
          </p>

          <h2>2. Contest entries</h2>
          <p>
            Your entry fee is deducted from your FM coin balance when you submit your
            predictions. You can edit your picks free of charge until the contest locks.
          </p>
          <p><strong>We refund your entry fee in full when:</strong></p>
          <ul>
            <li>The fight or event is cancelled and does not take place.</li>
            <li>The contest is cancelled or voided by us for any reason.</li>
            <li>A technical fault on our side prevented your entry from being scored correctly.</li>
          </ul>
          <p>
            Refunds are returned as FM coins to the wallet the fee was taken from, and you
            receive an email confirming it. You are refunded <strong>exactly what you were
            charged</strong>, even if the contest entry fee changed afterwards.
          </p>
          <p><strong>We do not refund an entry because:</strong></p>
          <ul>
            <li>Your predictions did not score as well as you hoped.</li>
            <li>A fighter withdrew and was replaced, and the contest still ran.</li>
            <li>You changed your mind after the contest locked.</li>
          </ul>
          <p>
            If you believe a contest was scored incorrectly, raise a support ticket in the{' '}
            <strong>Scoring</strong> category with the contest details. We will review the
            official statistics against your entry and correct any genuine error.
          </p>

          <h2>3. FM+ memberships</h2>
          <p>
            FM+ is charged for a fixed term. You can cancel at any time; cancelling stops
            future renewals and your benefits continue until the end of the term you paid
            for.
          </p>
          <p>
            <strong>Refunds.</strong> If you cancel within <strong>7 days</strong> of a
            charge and have not used a members-only benefit during that period (for example
            a discounted streak save or bonus coins), contact support and we will refund that
            term. After 7 days, or once a benefit has been used, the current term is not
            refundable but will not renew.
          </p>
          <p>
            Bonus coins already credited as part of an FM+ term may be deducted from your
            balance when a refund is issued.
          </p>

          <h2>4. Apparel</h2>
          <p>
            Apparel is sold and fulfilled through our Etsy shop, and is covered by{' '}
            <strong>Etsy&rsquo;s policies and the shop&rsquo;s own returns terms</strong>,
            not this policy. Contact us through Etsy for anything relating to an apparel
            order.
          </p>

          <h2>5. Affiliate payouts</h2>
          <p>
            When you request a payout, the amount is deducted from your affiliate balance
            immediately so the same earnings cannot be requested twice.
          </p>
          <p>
            If a payout request is declined, <strong>the full amount is returned to your
            balance</strong> and you receive an email confirming it. Nothing is lost. You can
            request it again, or contact support to discuss why it was declined.
          </p>
          <p>
            Payouts may be withheld where we reasonably believe an account has breached our
            Terms of Service — for example an affiliate entering their own promoted contest.
            We will tell you the reason.
          </p>

          <h2>6. Accounts closed for breaching our terms</h2>
          <p>
            If we close an account for cheating, fraud, multiple accounts, or another serious
            breach of our Terms of Service, entry fees for contests affected by that breach
            are not refundable. Any unused coins purchased with a legitimate payment will be
            refunded to the original payment method where we are able to do so.
          </p>

          <h2>7. Chargebacks</h2>
          <p>
            Please contact us before raising a chargeback with your bank. Most issues are
            resolved faster directly, and a chargeback may suspend your account while it is
            investigated. If we made a mistake, we would rather fix it ourselves.
          </p>

          <h2>8. How to request a refund</h2>
          <p>
            Submit a support ticket in the <strong>Payment</strong> category, or email us,
            including:
          </p>
          <ul>
            <li>The email address on your account</li>
            <li>The order number or contest name</li>
            <li>What happened</li>
          </ul>
          <p>
            Payment tickets are prioritised. Approved refunds to a payment method are
            typically issued within <strong>5&ndash;10 business days</strong>, depending on
            your bank. Refunds returned as FM coins appear in your wallet immediately.
          </p>

          <h2>9. Changes to this policy</h2>
          <p>
            We may update this policy. The version in force is the one published here on the
            date of your purchase or entry.
          </p>

          <div className="fmm-legal-links">
            <Link href="/terms">Terms of Use</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/contact">Contact support</Link>
          </div>
        </div>

        <style jsx>{`
          .fmm-legal-page {
            min-height: 100vh;
            padding: 110px 20px 80px;
            color: #fff;
            background:
              radial-gradient(circle at 15% 8%, rgba(224, 30, 22, 0.22), transparent 34%),
              radial-gradient(circle at 85% 10%, rgba(26, 94, 220, 0.2), transparent 32%),
              linear-gradient(180deg, #070910 0%, #020306 100%);
          }
          .fmm-legal-shell {
            width: min(820px, 100%);
            margin: 0 auto;
            padding: clamp(24px, 4vw, 44px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            background: rgba(8, 11, 18, 0.9);
          }
          .fmm-legal-back {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 22px;
            color: rgba(255, 255, 255, 0.65);
            font-weight: 800;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            text-decoration: none;
          }
          h1 {
            margin: 0;
            font-size: clamp(2rem, 5vw, 3rem);
            text-transform: uppercase;
            line-height: 1;
          }
          .fmm-legal-updated {
            margin: 10px 0 22px;
            color: #ffcf45;
            font-weight: 800;
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .fmm-legal-lead {
            padding: 14px 16px;
            border-left: 3px solid #ffcf45;
            background: rgba(255, 207, 69, 0.06);
            border-radius: 0 10px 10px 0;
          }
          h2 {
            margin: 30px 0 10px;
            font-size: 1.12rem;
            color: #ffcf45;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          p, li {
            color: rgba(255, 255, 255, 0.78);
            line-height: 1.75;
            font-size: 0.95rem;
          }
          ul { padding-left: 20px; margin: 8px 0 14px; }
          li { margin-bottom: 6px; }
          strong { color: #fff; }
          .fmm-legal-links {
            display: flex;
            gap: 18px;
            flex-wrap: wrap;
            margin-top: 36px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          .fmm-legal-links :global(a) {
            color: #ffcf45;
            font-weight: 800;
            font-size: 0.85rem;
            text-decoration: none;
          }
          .fmm-legal-links :global(a:hover) { text-decoration: underline; }
        `}</style>
      </main>
    </>
  );
}
