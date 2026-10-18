// Search engine discovery for the canonical public entry points.
// Fight-specific URLs must only be added when their live registry paths are verified.
export default function Sitemap() { return null; }
export async function getServerSideProps({ res }) {
  const origin='https://www.fantasymmadness.com';
  const paths=['/','/welcome'];
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
    paths.map(path=>'<url><loc>'+origin+path+'</loc><changefreq>daily</changefreq></url>').join('')+
    '</urlset>';
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);res.end();return {props:{}};
}
