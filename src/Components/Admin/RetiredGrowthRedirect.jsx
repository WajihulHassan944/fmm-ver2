import { useEffect } from 'react';
import { useRouter } from 'next/router';

// The retired growth screens send admins to the matching Growth Engine section.
export default function RetiredGrowthRedirect({ section = 'overview' }) {
  const router = useRouter();
  useEffect(() => { router.replace(section === 'overview' ? '/administration/growth-engine' : `/administration/growth-engine/${section}`); }, [router, section]);
  return <main style={{ padding: 24 }} data-testid="retired-growth-redirect"><p>This screen was replaced by the Growth Engine. Opening it now…</p></main>;
}
