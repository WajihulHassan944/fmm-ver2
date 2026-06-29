import { swarmRequest } from './swarmApi';

export const seoAdminApi = {
  metadata: (query = {}) => swarmRequest('/api/admin/seo/metadata', { query }),
  saveMetadata: (body = {}) => swarmRequest('/api/admin/seo/metadata', { method: 'POST', body }),
  applySeo: (body = {}) => swarmRequest('/api/admin/seo/apply', { method: 'POST', body }),
  swarmReports: (query = {}) => swarmRequest('/api/admin/seo/swarm-reports', { query }),
  implementationRoadmap: () => swarmRequest('/api/admin/seo/implementation-roadmap'),
  previewInternalLinks: (body = {}) => swarmRequest('/api/admin/seo/internal-links/preview', { method: 'POST', body }),
};

export const getSeoItems = (payload) => {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.reports)) return payload.reports;
  if (Array.isArray(payload?.metadata)) return payload.metadata;
  return [];
};

export const getSeoPagination = (payload) => payload?.pagination || payload?.data?.pagination || {};

export const summarizeSeoPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return 'No payload details returned yet.';
  return payload.summary
    || payload.metaDescription
    || payload.description
    || payload.applicationPlan?.summary
    || payload.recommendation
    || payload.title
    || JSON.stringify(payload).slice(0, 180);
};
