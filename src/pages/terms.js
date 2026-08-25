import Head from 'next/head';
import Link from 'next/link';

// The Terms of Use as a real page, so the app can link to it from settings and
// from the signup consent line. Content is kept in step with
// "Terms of Use.dc.html" — update both together.
const TERMS_STYLES = `.fmm-terms h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 19pt; margin: 28pt 0 6pt; letter-spacing: .01em; break-after: avoid; }
    .fmm-terms h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 13pt; margin: 17pt 0 4pt; break-after: avoid; }
    .fmm-terms p, .fmm-terms li { font-family: 'Lora', Georgia, serif; font-size: 10.5pt; line-height: 1.62; text-align: justify; text-wrap: pretty; orphans: 3; widows: 3; }
    .fmm-terms li { margin-bottom: 5pt; }
    .fmm-terms ul, .fmm-terms ol { padding-left: 18pt; margin: 8pt 0 12pt; }
    .fmm-terms .rule { border: 0; border-top: 1px solid rgba(32,31,29,.16); margin: 22pt 0 0; }
    .fmm-terms .blank { font-family: 'Lora', Georgia, serif; background: #f6ecdc; border-bottom: 1px solid #b68235; padding: 0 3px; }
    .fmm-terms table { width: 100%; border-collapse: collapse; margin: 10pt 0 14pt; font-family: 'Lora', Georgia, serif; font-size: 9.5pt; font-variant-numeric: tabular-nums; }
    .fmm-terms th { text-align: left; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 10pt; border-bottom: 1px solid #201f1d; padding: 5pt 8pt 5pt 0; }
    .fmm-terms td { border-bottom: 1px solid rgba(32,31,29,.16); padding: 5pt 8pt 5pt 0; vertical-align: top; break-inside: avoid; }
    .fmm-terms .caps { font-family: 'Lora', Georgia, serif; font-size: 9.5pt; line-height: 1.6; text-transform: uppercase; letter-spacing: .015em; text-align: justify; orphans: 3; widows: 3; }`;

const TermsOfUse = () => (
  <>
    <Head>
      <title>Terms of Use · Fantasy MMAdness</title>
      <meta name="description" content="The terms that govern your use of Fantasy MMAdness contests, coins and prizes." />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap"
        rel="stylesheet"
      />
    </Head>
    <style jsx global>{TERMS_STYLES}</style>

    <div style={{ background: '#f3f2f2', minHeight: '100vh', padding: '28px 18px 64px' }}>
      <div className="fmm-terms" style={{ maxWidth: 760, margin: '0 auto', color: '#201f1d' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block', marginBottom: 22, fontFamily: "'Lora', Georgia, serif",
            fontSize: 13, color: '#8a6425', textDecoration: 'none', borderBottom: '1px solid rgba(182,130,53,.4)',
          }}
        >
          ← Back to Fantasy MMAdness
        </Link>


        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16pt', borderBottom: '1px solid #201f1d', paddingBottom: '7pt' }}>
        <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '12pt', letterSpacing: '.1em', textTransform: 'uppercase' }}>Fantasy MMAdness LLC</div>
        <div style={{ fontFamily: '"Lora", Georgia, serif', fontSize: '9pt', color: '#5d5a55', fontVariantNumeric: 'tabular-nums' }}>Updated effective 8/25/2026 · Version 1.0</div>
        </div>

        <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 400, fontSize: '34pt', lineHeight: 1.08, margin: '26pt 0 10pt', letterSpacing: '-.01em' }}>Terms of Use</h1>

        <p style={{ fontSize: '12pt', lineHeight: 1.55, color: '#3d3a36', textAlign: 'left', marginBottom: '4pt' }}>
        Please read these Terms before using Fantasy MMAdness. They set out what we owe you, what you agree to,
        and the limits of both. They include a section on where paid contests are available, and a limitation of
        our liability.
        </p>

        <hr className="rule" />

        <h2>1. Who we are and what this covers</h2>
        <p>
        Fantasy MMAdness is operated by <strong>Fantasy MMAdness LLC</strong> ("Fantasy MMAdness", "we", "us").
        These Terms of Use govern your use of our website, our mobile application, and every contest,
        subscription, store purchase and other service we offer through them (together, the "Services").
        </p>
        <p>
        By creating an account, entering a contest, buying anything from us, or otherwise using the Services,
        you agree to these Terms and to our Privacy Policy. If you do not agree to them, do not use the
        Services.
        </p>
        <p>
        We are a fantasy sports operator. We are not a sportsbook, a casino, or a betting exchange. We do not
        accept wagers on the outcome of any fight, and we do not offer odds. Our contests are skill contests in
        which entrants predict measurable in-fight statistics and are scored against the official results.
        </p>

        <h2>2. Eligibility</h2>
        <p>To open an account and use the Services, you must:</p>
        <ul>
        <li>be at least 18 years old, or 21 years old if you are located in Alabama, Arizona, Iowa, Louisiana, Massachusetts or Nebraska;</li>
        <li>be physically located in a US state or territory where we make the Services available;</li>
        <li>have the legal capacity to enter into this agreement; and</li>
        <li>not be excluded under any provision of these Terms.</li>
        </ul>
        <p>
        You may hold <strong>one account only</strong>. We detect and act on duplicate accounts. If we find that
        you hold or control more than one, we may suspend or close any or all of them and withhold or reverse
        any prize associated with them.
        </p>
        <p>
        You are responsible for everything that happens under your account, including keeping your password
        confidential. Do not let anyone else use your account. If you believe someone has accessed it without
        your permission, contact us immediately at support@fantasymmadness.com.
        </p>

        <h3>Who may not enter a paid contest</h3>
        <ul>
        <li>Our employees, contractors and their household members.</li>
        <li>Employees, contractors and officials of any promotion, sanctioning body, or athletic commission governing a fight we run contests on, where their own rules prohibit participation.</li>
        <li>Any fighter, coach, cornerman, referee, judge, or member of a fighter's team, for any contest that includes a fight they are involved in.</li>
        <li>Anyone with access to non-public information about a fight that is not available to other entrants — including undisclosed injury, weight, or withdrawal information.</li>
        <li>Anyone prohibited from participating by law, court order, or the rules of their employer or professional body.</li>
        <li>The promoter of a contest, in their own contest. This is enforced automatically.</li>
        </ul>

        <h2>3. Where paid contests are available</h2>
        <p>
        Fantasy sports law differs by state. We therefore operate in two modes, and your state determines which
        one applies to you. Your eligible mode is set from the residence state on your account and is verified
        before any entry is accepted.
        </p>
        <table>
        <thead>
        <tr><th style={{ width: '26%' }}>Mode</th><th style={{ width: '30%' }}>Where</th><th>What it means</th></tr>
        </thead>
        <tbody>
        <tr>
        <td>Paid contests</td>
        <td>45 states and the District of Columbia, subject to our registration status in each</td>
        <td>You may buy FM Coins, enter contests that charge an entry fee, and request withdrawal of eligible winnings.</td>
        </tr>
        <tr>
        <td>Free play only</td>
        <td>Hawaii, Idaho, Montana, Nevada, Washington</td>
        <td>You may create an account and enter free contests. You cannot be charged an entry fee, and you cannot buy FM Coins. Prizes are non-cash: badges, leaderboard titles, sponsor-provided merchandise and event codes.</td>
        </tr>
        </tbody>
        </table>
        <p>
        Free-play states are enforced in our systems and cannot be switched on for paid entry by configuration.
        If you move between states, update your account; entering from a state where paid contests are
        unavailable to you is a breach of these Terms and may void the entry.
        </p>
        <p>
        The availability of the Services is not an offer or solicitation anywhere they are unlawful, and it is
        not a representation that your own participation is lawful where you are. You are responsible for
        knowing the law that applies to you.
        </p>

        <h2>4. FM Coins</h2>
        <p>
        FM Coins are the unit we use for contest entry and prizes. Coins are a limited licence to participate in
        the Services. They are not legal tender, not a deposit, not a stored-value instrument, and not
        transferable between accounts. They carry no interest and no ownership rights.
        </p>
        <ul>
        <li><strong>Purchased coins</strong> are bought with money in paid-contest states. All purchases are final; see Section 11.</li>
        <li><strong>Prize coins</strong> are awarded from contests you win.</li>
        <li><strong>Promotional coins</strong> are granted by us — sign-up bonuses, streak rewards, spin-wheel awards, guest claims and similar. Promotional coins may be used for entry but are not redeemable for cash, and we may set conditions on them.</li>
        <li><strong>Free-contest coins</strong> awarded in free-play states are not redeemable for cash.</li>
        </ul>
        <p>
        Every change to your coin balance is recorded in a ledger attached to your account, and you may request
        a statement at any time. Where we discover a balance created by error, fraud, or a technical fault, we
        may correct it and will tell you when we do.
        </p>

        <h2>5. Contests, entry and scoring</h2>
        <p>
        Each contest is attached to a specific fight or card, and states its entry fee, its prize structure, and
        any minimum number of entrants before you enter. Entering charges the fee shown at that moment; the fee
        is taken from your balance in a single operation, so an entry is either recorded and paid for, or neither.
        </p>
        <h3>Locking</h3>
        <p>
        Predictions may be entered and edited until the contest locks — normally at the scheduled start of the
        fight. After the lock, no prediction can be submitted or changed, by you or by us. Once a contest has
        been settled, predictions are permanently closed.
        </p>
        <h3>Scoring</h3>
        <p>
        Scoring is performed by us, on our servers, from the official round-by-round statistics we record for
        the fight. Live statistics shown in the app during a fight are for information only and are not used to
        determine results.
        </p>
        <p>
        Results are calculated once the fight is complete and the official statistics are entered.
        <strong>Settled results are final.</strong> We do not re-score a settled contest because a promotion,
        commission or statistics provider later adjusts a figure, except where we determine at our discretion
        that an error was ours and materially affected the outcome.
        </p>
        <h3>Cancelled, postponed and voided fights</h3>
        <p>
        If a fight is cancelled, or does not take place in a form that allows scoring, the contest is voided and
        every entry fee is returned in full to the balance it came from. If a contest does not reach its stated
        minimum number of entrants, it is voided and all entry fees are refunded. If a fighter withdraws and is
        replaced, we may void the contest or score it as run, and will say which before the lock wherever
        possible.
        </p>

        <h2>6. Prizes and payouts</h2>
        <p>
        A contest's prize pool is funded from entry fees and is stated before entry. Unless a contest says
        otherwise, prizes are distributed by finishing position as follows.
        </p>
        <table>
        <thead>
        <tr><th style={{ width: '34%' }}>Entrants</th><th>Distribution</th></tr>
        </thead>
        <tbody>
        <tr><td>Fewer than 5</td><td>Winner takes the pool</td></tr>
        <tr><td>5 to 19</td><td>60% / 30% / 15% to first, second and third</td></tr>
        <tr><td>20 or more</td><td>50% / 30% / 20% to first, second and third</td></tr>
        </tbody>
        </table>
        <p>
        Where entrants tie on points, the tied places are combined and split equally between them. Prizes are
        credited to your account balance when the contest settles, and you are notified by email.
        </p>
        <h3>Withdrawal</h3>
        <p>
        You may request a withdrawal of eligible winnings at any time. Before we pay, we may require you to
        verify your identity, your age, your location, and your ownership of the payment method — and to
        complete any tax documentation the law requires. We will process a verified request within
        <strong>five business days</strong>. Where your bank or payment provider takes longer to make the funds
        available, the request is still treated as processed by us. We may refuse or delay a withdrawal where we
        have a reasonable belief of fraud, of a breach of these Terms, or of a legal obligation that prevents
        payment.
        </p>
        <p>
        Promotional coins, and coins won in free contests, are not withdrawable. Taxes on any prize are your
        responsibility.
        </p>

        <h2>7. Season Cards</h2>
        <p>
        A Season Card is a contest that runs across a whole season rather than a single
        fight. You draft one competitor per sport — boxing, bare knuckle, MMA, kickboxing
        and pro wrestling — and as each of them competes during the season, what they
        actually do in the ring or cage is credited to your card. Your score is the
        combined result of all five.
        </p>

        <h3>How a Season Card is scored</h3>
        <p>
        Each competitor's output is measured with the same statistics we record for our
        fight contests: for boxing and bare knuckle, head punches, body punches, total
        punches, rounds won and knockdowns; for MMA and kickboxing, strikes, kicks, knees,
        elbows, rounds won and knockdowns; for pro wrestling, signature moves, near falls,
        reversals and pinfalls. Decisive events carry additional weight.
        </p>
        <p>
        Because a twelve-round boxing match produces far more countable output than a
        three-round contest, <strong>each slot is scored out of 100 within its own
        sport</strong>, measured against the strongest result any entrant obtained from
        that slot during that season. The five slots combine into a score out of 500. Your
        competitor's raw figure and the converted figure are both shown to you. The
        conversion exists so that different sports can be added together fairly, and it
        means the scale for a slot is set by what was actually achieved in that sport that
        season rather than by a fixed number.
        </p>

        <h3>Called numbers</h3>
        <p>
        When you draft, you may optionally name a statistic and a figure you believe your
        competitor will reach across the season. If your competitor reaches or exceeds the
        figure you named, you score that figure as a bonus, capped as stated in the app.
        If they fall short of it, you score no bonus and keep the rest of your card's
        score. A called number is optional and cannot reduce your score.
        </p>

        <h3>Rules you should know before you draft</h3>
        <ul>
        <li><strong>If a competitor you drafted never competes during the season, that slot scores zero.</strong> We do not substitute a competitor for you, and drafting people who are actually scheduled to compete is part of the contest.</li>
        <li>A slot in which no entrant scored is worth nothing to every entrant equally.</li>
        <li>You may hold one card per season, and each slot must be a different competitor.</li>
        <li>Cards are locked when the draft window closes and cannot be changed after that.</li>
        <li>Competitors are drafted from those scheduled on our platform at the time you draft.</li>
        <li>Scoring uses the official statistics we record for each event, on the same basis as our fight contests. Live figures shown during an event are for information only.</li>
        <li>Settled season results are final, on the same basis as Section 5.</li>
        </ul>

        <h3>Entry, prizes and cancellation</h3>
        <p>
        A Season Card may be free to enter or may charge an entry fee. Where it charges a
        fee, the fee is taken once when you lock your card, and paid seasons are available
        only where paid contests are available to you under Section 3. Free seasons are
        available everywhere and award non-cash prizes under Section 9.
        </p>
        <p>
        Where a paid season carries a prize pool, prizes are distributed on the same basis
        as Section 6. If a paid season finishes with only one paid card, there is no field
        to score against and <strong>that entry is refunded in full instead of a prize
        being paid</strong>. If we cancel a season, every entry fee is refunded in full.
        </p>

        <h2>8. Team Cards</h2>
        <p>
        A Team Card is a contest run on a single event. You pick a set number of
        competitors — normally five — from the bouts on that card, and your score is
        the combined output of all of them on the night.
        </p>
        <p>
        Because every competitor on a Team Card is scored under the same rules for the
        same sport, your score is a straightforward total of what each of them did. No
        conversion or adjustment is applied.
        </p>

        <h3>One competitor per bout</h3>
        <p>
        You must take <strong>no more than one competitor from any single bout</strong>.
        This is enforced when you enter. It means every pick you make is a genuine
        selection rather than a way of covering both outcomes of the same fight.
        </p>

        <h3>Rules you should know before you enter</h3>
        <ul>
        <li>Your picks must be for bouts still open for entry. A bout that has already locked cannot be picked.</li>
        <li>You may hold one team per contest, and your team is locked once entered.</li>
        <li>Scoring uses the official statistics we record for each bout, on the same basis as Section 5. Figures shown live during an event are for information only.</li>
        <li>A competitor whose bout is cancelled or does not take place scores nothing for that slot. Where a whole card is cancelled we will cancel the contest and refund every entry.</li>
        <li>Each pick may optionally carry a called number, which works as described in Section 7 — reaching or exceeding your figure earns a bonus, and falling short costs you nothing beyond that bonus.</li>
        <li>Settled results are final, on the same basis as Section 5.</li>
        </ul>

        <h3>Entry, prizes and cancellation</h3>
        <p>
        A Team Card may be free or may charge an entry fee. Paid Team Cards are available
        only where paid contests are available to you under Section 3; free Team Cards are
        available everywhere and award non-cash prizes under Section 9. Prizes on a paid
        Team Card are distributed on the same basis as Section 6.
        </p>
        <p>
        If a paid Team Card finishes with only one paid team, there is no field to score
        against and <strong>that entry is refunded in full instead of a prize being
        paid</strong>. If we cancel a contest, every entry fee is refunded in full.
        </p>
        <p>
        Team Cards may also be run by league operators for their own members, as described
        in Section 11. A league operator may not enter a contest they are running.
        </p>

        <h2>9. Non-cash prizes</h2>
        <p>
        Some contests — including all contests in free-play states — award prizes that are not money: badges,
        leaderboard titles, event access codes, and merchandise or other goods provided by a sponsor. These
        appear in your trophy case.
        </p>
        <ul>
        <li>Badges, titles and codes are awarded to your account immediately on settlement.</li>
        <li>Physical prizes are fulfilled by us or by the sponsor. We will contact you for delivery details, and you must respond within 30 days or the prize may be forfeited.</li>
        <li>Non-cash prizes have no cash value, cannot be exchanged for coins or money, and are not transferable.</li>
        <li>Where an advertised prize becomes unavailable, we may substitute one of equal or greater value.</li>
        <li>Sponsor-provided prizes are supplied as-is by the sponsor. Where a sponsor imposes its own conditions, we will tell you what they are.</li>
        </ul>

        <h2>10. FM+ subscription</h2>
        <p>
        FM+ is an optional paid subscription. It runs for 30 days and <strong>renews automatically</strong> at
        the then-current price until you cancel. You may cancel at any time from your account; cancellation
        stops the next renewal and you keep your benefits until the end of the period you have paid for. We do
        not pro-rate part-months. If we change the price, we will tell you before the change takes effect and
        you may cancel before it does.
        </p>

        <h2>11. Payments and refunds</h2>
        <p>
        Payments are handled by our payment processors; we do not store your full card details. Charges appear
        on your statement as <strong>FANTASYMMADNESS</strong>. You confirm that any payment method you use is your
        own.
        </p>
        <p>
        Coin purchases and subscription charges are final and, except where the law requires otherwise or these
        Terms provide for it, are not refundable. Entry fees are refunded where a contest is voided or falls
        short of its minimum entrants, as set out in Section 5. If a payment is charged back, we may void any
        winnings derived from it, deduct the amount from your balance, and suspend your account while we
        investigate.
        </p>
        <p>
        Merchandise sold through our apparel store is fulfilled by a third-party marketplace and is subject to
        that marketplace's terms, delivery times and returns policy.
        </p>

        <h2>12. Leagues, promoters and affiliates</h2>
        <p>
        Users may create leagues and promote contests to their members ("promoters" or "affiliates"). If you
        operate a league:
        </p>
        <ul>
        <li>You may not enter a contest you promote.</li>
        <li>You earn a share of the platform's revenue on contests you promote, at the rate stated in your promoter agreement, credited to your promoter balance.</li>
        <li>You may request payout of a confirmed promoter balance. Payouts require verified identity, verified payment details, and any tax documentation the law requires. We review each request and may decline it, with a reason.</li>
        <li>You are responsible for how you promote. You may not misrepresent prizes, guarantee winnings, imply that we are a sportsbook, market to people under the minimum age, or promote paid contests into a free-play state.</li>
        <li>We may suspend or terminate a league, withhold a payout, or close a promoter account for a breach of these Terms.</li>
        </ul>
        <p>
        A league operator is not our employee, agent or partner, and nothing in these Terms creates a
        partnership, joint venture or fiduciary relationship.
        </p>

        <h2>13. Head-to-head contests</h2>
        <p>
        Head-to-head contests, in which two entrants stake coins against one another on the same fight, are
        <strong>not currently offered</strong>. Where and when we make them available, they will be governed by
        these Terms together with any additional rules published at that time, and they will be offered only in
        states where they are permitted, and a platform fee will be deducted from the
        combined stakes of a decided contest and disclosed to you before you commit. We
        may invalidate a head-to-head result where we identify collusion or any other
        conduct that undermines the contest.
        </p>

        <h2>14. Conduct you agree to avoid</h2>
        <p>Your account may be suspended or closed, and prizes withheld or reversed, if you:</p>
        <ul>
        <li>give false information when registering, entering, or claiming a prize — including about your age or your location;</li>
        <li>hold or control more than one account, or enter on behalf of someone else;</li>
        <li>collude with other entrants, or coordinate entries across accounts;</li>
        <li>use automated means — bots, scrapers, scripted clients — to enter contests or collect data from the Services;</li>
        <li>exploit a bug, pricing error, or scoring fault rather than reporting it;</li>
        <li>abuse promotions, referral programmes, or free-coin offers, including by creating accounts or devices to claim them repeatedly;</li>
        <li>interfere with the Services, their security, or their scoring;</li>
        <li>harvest other users' information, or use it to contact them without their consent; or</li>
        <li>use the Services for money laundering or any other unlawful purpose.</li>
        </ul>
        <p>
        Forfeiting a prize does not prevent us from pursuing any other remedy available to us. Any attempt to
        deliberately damage the Services or undermine the legitimate operation of a contest may be a criminal
        offence, and we will pursue every remedy available to us.
        </p>

        <h2>15. Responsible play</h2>
        <p>
        We want the Services to stay entertainment. The following tools are available in your account settings,
        and we encourage you to use them:
        </p>
        <ul>
        <li><strong>Deposit limits.</strong> Cap what you can spend over a period you choose. A lower limit takes effect immediately; raising one takes effect after a cooling-off period.</li>
        <li><strong>Self-exclusion.</strong> Close your account to entry and purchase for a period you choose. While you are self-excluded we will not accept entries or payments from you, and we will not send you promotional email. A self-exclusion cannot be lifted early.</li>
        <li><strong>Session and spending history.</strong> Your full entry and balance history is available to you at any time.</li>
        </ul>
        <p>
        We may also apply limits, or exclude an account, where we believe participation has stopped being
        responsible. If gambling or contest play is causing you harm, free confidential help is available from
        the National Council on Problem Gambling: call or text 1-800-522-4700, or visit ncpgambling.org.
        </p>
        <p>
        When you self-exclude, entries you have already paid for and that have already locked will be scored and
        paid as normal. Entries that have not locked will be voided and refunded.
        </p>

        <h2>16. Suspension, closure and dormancy</h2>
        <p>
        You may close your account at any time by contacting support. We will pay out any eligible balance,
        subject to verification.
        </p>
        <p>
        We may suspend or close your account where you breach these Terms, where we are required to by law, or
        where we have a reasonable belief of fraud. Where we do so and you hold a balance that is properly
        yours, we will return it. If we suspend your account while we investigate, contests you have already
        entered will still be scored.
        </p>
        <p>
        If you do not log in for three years, we will treat your account as dormant, tell you what it holds at
        the address on file, and close it if we hear nothing. A dormant closure does not extinguish your right
        to any balance.
        </p>

        <h2>17. Changes to a contest, and to these Terms</h2>
        <p>
        We may cancel, suspend or modify a contest where it cannot run as published, where its integrity or
        fairness is compromised, or where a technical fault affects it. Where we cancel a contest, entry fees
        are refunded. In the event of a malfunction affecting a contest, entries in it may be voided and
        refunded.
        </p>
        <p>
        We may change these Terms. Where a change is material, we will tell you by email or when you next sign
        in, at least <strong>14 days</strong> before it takes effect. If you do not accept a change,
        your remedy is to stop using the Services and close your account. Continuing to use the Services after a
        change takes effect means you accept it.
        </p>

        <h2>18. Your content</h2>
        <p>
        You may post content through the Services — a display name, an avatar, forum posts, league descriptions.
        You keep ownership of what you post. You grant us a non-exclusive, worldwide, royalty-free licence to
        host, store, reproduce and display it for the purpose of operating and promoting the Services.
        </p>
        <p>
        You confirm you have the right to post what you post, and that it is not unlawful, defamatory, obscene,
        hateful, or infringing of anyone's rights. We may remove content or suspend an account for a breach,
        but we are not obliged to monitor what users post and we are not responsible for it. Content you delete
        may persist in backups for a period.
        </p>
        <p>
        Where lawful, entrants and winners consent to our use of their display name and finishing position in
        leaderboards, results and reasonable promotion of the Services. We will not use your photograph or
        likeness in advertising without asking you first.
        </p>

        <h2>19. Our intellectual property</h2>
        <p>
        The Services, and everything in them we own or license — the software, the scoring system, the text,
        graphics, logos and the Fantasy MMAdness name — remain ours. You may use them only as these Terms
        permit. You may not copy, reverse engineer, resell, scrape, or build a competing product from them, and
        you may not remove any proprietary notice.
        </p>
        <p>
        Fighter names, promotion names and event names are used for identification only. We are not affiliated
        with, endorsed by, or sponsored by any promotion or sanctioning body unless we say so explicitly.
        </p>

        <h2>20. Complaints and disputes</h2>
        <p>
        If something goes wrong, contact us first at support@fantasymmadness.com. We will acknowledge your
        complaint within 5 business days and aim to resolve it within 30 days, and in any event within 90 days.
        If we decline what you have asked for, we will tell you why.
        </p>
        <p>
        Where a dispute concerns the identity of the person who submitted an entry, the entry is treated as
        submitted by the registered account holder.
        </p>
        <h3>Informal resolution first</h3>
        <p>
        Before starting a formal proceeding, you agree to give us 30 days to resolve the matter informally.
        Send a written notice of your claim to support@fantasymmadness.com describing what happened and what you
        want. We will do the same before bringing a claim against you. This step is a requirement, and either
        party may ask a court or arbitrator to enforce it.
        </p>

        <h3>Binding arbitration</h3>
        <p>
        If we cannot resolve a dispute informally, you and we agree that it will be settled by
        <strong>binding individual arbitration</strong> administered by the American Arbitration Association
        under its Consumer Arbitration Rules, rather than in court. The arbitrator's decision is final and may
        be entered as a judgment. The arbitration will be conducted by documents, by telephone or by
        videoconference, or in person in the county where you live, whichever you choose. Where the AAA rules
        require us to pay the filing and arbitrator fees for a consumer claim, we will pay them.
        </p>
        <p>
        <strong>Exceptions.</strong> Either of us may bring an individual claim in small-claims court instead,
        and either of us may ask a court for an injunction to stop infringement or misuse of intellectual
        property. Nothing here prevents you from reporting a matter to a government agency or regulator.
        </p>

        <h3>No class actions</h3>
        <p className="caps">
        You and we agree that each may bring claims against the other only in an individual capacity, and not as
        a plaintiff or class member in any purported class, collective, consolidated or representative
        proceeding. The arbitrator may not consolidate more than one person's claims. You and we waive any right
        to a jury trial. If this paragraph is found unenforceable as to a particular claim, that claim — and only
        that claim — will proceed in court, and the rest of this Section still applies.
        </p>

        <h3>Your right to opt out</h3>
        <p>
        You may reject this arbitration agreement by emailing support@fantasymmadness.com with your account
        email and the words "arbitration opt-out" <strong>within 30 days of first accepting these Terms</strong>.
        Opting out does not affect anything else in these Terms, and we will not close your account or treat you
        differently for doing so. If we later change this Section in a way that materially affects you, you will
        have a fresh 30 days to opt out of the change.
        </p>

        <h2>21. Disclaimers</h2>
        <p className="caps">
        The services are provided "as is" and "as available". To the fullest extent permitted by law, we
        disclaim all warranties, express or implied, including merchantability, fitness for a particular
        purpose, non-infringement and title. We do not warrant that the services will be uninterrupted,
        error-free, or free of harmful components, or that any defect will be corrected.
        </p>
        <p className="caps">
        We do not warrant that your use of the services is lawful where you are, and we specifically disclaim
        any such warranty. Statistics, results and other information are provided for use in the services and
        we do not warrant their accuracy, completeness or availability.
        </p>
        <p>
        We are not responsible for events outside our reasonable control, including network, hosting and power
        failures, acts of government, industrial action, natural events, epidemics, or the failure of a
        third-party service we depend on. We are not responsible for incomplete or misdirected entries caused by
        a fault outside our systems, or for damage to your device arising from your use of the Services.
        </p>

        <h2>22. Limitation of liability</h2>
        <p className="caps">
        To the fullest extent permitted by law, neither Fantasy MMAdness LLC nor its members, officers,
        employees, contractors, agents or suppliers will be liable to you for any indirect, incidental,
        special, consequential, exemplary or punitive damages, or for lost profits, lost data, or loss of
        goodwill, arising out of or relating to the services — whether in contract, tort, strict liability or
        otherwise, and even if we have been advised of the possibility of such damages.
        </p>
        <p className="caps">
        Our total liability to you for all claims arising out of or relating to the services will not exceed the
        greater of (a) the total amount you paid us in the twelve months before the event giving rise to the
        claim, or (b) one hundred US dollars ($100).
        </p>
        <p>
        Some states do not allow the exclusion or limitation of certain damages, so parts of the two paragraphs
        above may not apply to you. Nothing in these Terms excludes liability we cannot exclude by law,
        including for our own fraud or willful misconduct. Your sole and exclusive remedy if you are
        dissatisfied with the Services is to stop using them and close your account.
        </p>

        <h2>23. Indemnity</h2>
        <p>
        You agree to indemnify and hold harmless Fantasy MMAdness LLC and its members, officers, employees,
        contractors and agents from any third-party claim, liability, loss or expense — including reasonable
        legal fees — arising out of your breach of these Terms, your use of the Services, any payment method you
        use, or any content you post.
        </p>

        <h2>24. General</h2>
        <p>
        These Terms, together with our Privacy Policy and any contest-specific rules we publish, are the whole
        agreement between you and us about the Services, and they replace anything said before.
        </p>
        <p>
        These Terms are governed by the laws of the <strong>State of Georgia</strong>, without regard to its
        conflict-of-laws rules, except that the Federal Arbitration Act governs Section 20. Nothing in this
        paragraph deprives you of the protection of any mandatory consumer-protection law of the state where you
        live. If a court finds any provision unenforceable, the rest stays in force. If
        we do not enforce a right immediately, we do not waive it. You may not assign these Terms; we may assign
        them in connection with a merger, acquisition or sale of assets. Nothing in these Terms gives any right
        to a third party. Provisions that by their nature should survive termination — including Sections 19,
        21, 22 and 23 — survive it.
        </p>

        <h2>25. Contact</h2>
        <p style={{ marginBottom: '4pt' }}>
        Fantasy MMAdness LLC, a Georgia limited liability company<br />
        support@fantasymmadness.com
        </p>
        <p>
        Email is our channel for all account, contest, payment and complaint matters, and we monitor it every
        business day. Where a law requires us to give you a postal address, or to accept service of legal
        process at one, we will provide it on request.
        </p>

        <hr className="rule" />
        <p style={{ fontSize: '9pt', color: '#5d5a55', textAlign: 'left', marginTop: '12pt' }}>
        Updated effective 8/25/2026. Governed by Georgia law, with support handled by email. The arbitration
        terms in Section 20 and the liability cap in Section 22 were drafted as standard operator provisions and
        should be confirmed before publication. This document was written to describe how the Fantasy MMAdness
        platform actually operates; it is not legal advice, and it should be reviewed by a licensed Georgia
        attorney before you publish it.
        </p>

      </div>
    </div>
  </>
);

export default TermsOfUse;
