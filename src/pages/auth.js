import {affiliateAcceptanceConfig} from '@/server/affiliateAcceptanceConfig.cjs';
import dynamic from 'next/dynamic';

const AuthPortal = dynamic(() => import('@/Components/Auth/AuthPortal'), {
  loading: () => <div className="experience-page xp-route-loading">Preparing secure access...</div>,
});

export default function AuthPage() {
  return <AuthPortal />;
}

export async function getServerSideProps({query={}}){if(affiliateAcceptanceConfig()&&query.mode==='signup'&&query.role==='affiliate'&&query.utm_source==='fan_acquisition'){const params=new URLSearchParams();for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','invitationId'])if(typeof query[key]==='string'&&query[key].length<=256)params.set(key,query[key]);return{redirect:{destination:'/growth-affiliate-signup?'+params.toString(),permanent:false}};}return{props:{}};}
