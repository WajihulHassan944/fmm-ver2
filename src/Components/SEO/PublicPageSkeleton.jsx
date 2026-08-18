const PublicPageSkeleton = ({ count = 3, className = '' }) => (
  <div className={`fmm-seo-skeleton-grid ${className}`} aria-label="Loading public content">
    {Array.from({ length: count }).map((_, index) => (
      <div className="fmm-seo-skeleton-card" key={index}>
        <span />
        <strong />
        <p />
      </div>
    ))}
  </div>
);

export default PublicPageSkeleton;
