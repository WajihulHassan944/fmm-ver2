// Server-side guard for the website's own /api admin routes. In staging review mode
// they never forward anything to the live backend.
export const blockInStagingReview = (res) => {
  if (String(process.env.NEXT_PUBLIC_ADMIN_STAGING_REVIEW || '').trim().toLowerCase() !== 'on') return false;
  res.status(403).json({ message: 'This test copy is not connected to live admin data. Use the live site for this.', code: 'STAGING_REVIEW' });
  return true;
};
