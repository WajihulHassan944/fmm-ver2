import React,{useEffect,useState} from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import GrowthEngineCommandCenter from '@/Components/Admin/GrowthEngineCommandCenter';
export default function GrowthQA(){
 const [mounted,setMounted]=useState(false);useEffect(()=>setMounted(true),[]);
 if(!mounted)return <p role="status">Checking administrator session…</p>;
 return <AdminPrivateRoute><Head><title>Growth QA | FANTASY MMADNESS</title></Head>{process.env.NEXT_PUBLIC_GROWTH_AFFILIATE_ACCEPTANCE_ENABLED==='true'?<GrowthEngineCommandCenter growthRoute qaRoute/>:<p>Administrator QA is disabled in this environment.</p>}</AdminPrivateRoute>;
}
