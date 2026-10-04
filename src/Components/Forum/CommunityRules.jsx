import Link from 'next/link';
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

const rules=[
['Be respectful','Debate fights and predictions without harassment, hate speech, discriminatory remarks, threats, or personal attacks.'],
['Stay on topic','Keep replies relevant to the discussion so fight conversations remain useful and easy to follow.'],
['No spam','Do not flood discussions with repeated posts, unrelated links, or unsolicited promotions.'],
['Protect privacy','Do not post private addresses, phone numbers, account information, or other sensitive personal data.'],
['Report misconduct','Use moderation and support channels for abusive behavior instead of escalating the situation publicly.'],
['Keep posts readable','Use clear language and formatting. Avoid disruptive all-caps posts or intentionally unreadable content.'],
['Follow discussion guidelines','Respect pinned instructions and any additional rules shown for a specific community area.'],
['Respect intellectual property','Only share material you have the right to post and credit sources where appropriate.'],
['Contribute constructively','Fight debate can be intense; keep it about the sport, the predictions, and the ideas.'],
['Follow platform terms','Community participation remains subject to the FANTASY MMADNESS terms and platform policies.'],
];

export default function CommunityRules(){
 return <main className="experience-page"><section className="theme-container" style={{paddingTop:'36px',paddingBottom:'60px'}}>
  <Link href="/community-forum" className="premium-forum-back"><FaArrowLeft /> Back to community</Link>
  <header className="premium-community-toolbar" style={{marginTop:'18px'}}><div><p className="xp-eyebrow"><FaShieldAlt /> COMMUNITY CODE</p><h1>FANTASY MMADNESS Community Rules</h1><p>Keep the fight talk competitive, useful, and respectful.</p></div></header>
  <div className="user-reward-card-grid" style={{marginTop:'24px'}}>{rules.map(([title,copy],i)=><article className="user-reward-card" key={title}><div className="user-reward-card-number">{String(i+1).padStart(2,'0')}</div><div className="user-reward-card-copy"><h2>{title}</h2><p>{copy}</p></div></article>)}</div>
 </section></main>;
}
