import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Legacy sample URL: always take the owner to the original protected Growth Engine.
// Never show fabricated dashboard figures or bypass the existing admin gate.
export default function GrowthEngineOldPreviewRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/administration/growth-engine'); }, [router]);
  return <main style={{ padding: 24 }}>Opening the original Growth Engine…</main>;
}
