import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GROWTH_ENGINE_V2 } from '@/Utils/adminFeatures';
import FightLaunchDesk from './FightLaunchDesk';
import WeeklyFightGrowth from './WeeklyFightGrowth';
import GrowthEngineCommandCenter from './GrowthEngineCommandCenter';
import styles from './GrowthEngineCommandCenter.module.css';
const entries = [['overview','Growth Engine']];
export default function GrowthAdministration() {
  const router = useRouter();
  const [selectedFight, setSelectedFight] = useState('');
  const active = GROWTH_ENGINE_V2 && router.query.engine !== 'launch';
  const fight = selectedFight || (typeof router.query.fightId === 'string' ? router.query.fightId : '');
  const href = section => `/administration/growth?engine=${section}${fight ? `&fightId=${encodeURIComponent(fight)}` : ''}`;
  return <>
    {GROWTH_ENGINE_V2 && <nav aria-label="Growth departments" className={styles.tabs}>
      <Link className={styles.tab} href={fight ? `/administration/growth?engine=launch&fightId=${encodeURIComponent(fight)}` : '/administration/growth?engine=launch'} aria-current={!active ? 'page' : undefined}>Fight launch desk</Link>
      {entries.map(([id,label])=><Link className={styles.tab} href={href(id)} key={id} aria-current={active?'page':undefined}>{label}</Link>)}
    </nav>}
    {active ? <GrowthEngineCommandCenter growthRoute /> : <><FightLaunchDesk onFightSelection={setSelectedFight} /><WeeklyFightGrowth /></>}
  </>;
}
