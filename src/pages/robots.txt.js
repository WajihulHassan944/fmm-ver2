export default function Robots(){return null;}
export async function getServerSideProps({res}){
 res.setHeader('Content-Type','text/plain; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=3600');
 res.write('User-agent: *\nAllow: /\nDisallow: /administration/\nDisallow: /auth\nSitemap: https://www.fantasymmadness.com/sitemap.xml\n');
 res.end();return {props:{}};
}
