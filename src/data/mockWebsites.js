export const initialWebsites = [
  {
    id: 'p1',
    domain: 'techsphere.io',
    projectName: 'TechSphere Cloud',
    searchEngine: 'Google US (google.com)',
    country: 'United States',
    countryCode: 'US',
    trackingFrequency: 'Daily',
    createdAt: '2026-01-15T08:00:00Z',
    seoScore: 88,
    organicTraffic: 142850,
    trafficChange: 14.8,
    totalKeywords: 5,
    keywordsChange: 8.5,
    totalBacklinks: 18450,
    backlinksChange: 12.4,
    referringDomains: 1240,
    domainRating: 68,
    crawlHealth: 92,
    device: 'Desktop & Mobile',
    isPrimary: true,
    assignedTo: 'usr-admin',
    assignedName: 'Admin User'
  },
  {
    id: 'p2',
    domain: 'datamesh.io',
    projectName: 'DataMesh Systems',
    searchEngine: 'Google US (google.com)',
    country: 'United States',
    countryCode: 'US',
    trackingFrequency: 'Daily',
    createdAt: '2026-02-01T09:00:00Z',
    seoScore: 85,
    organicTraffic: 112000,
    trafficChange: 9.3,
    totalKeywords: 0,
    keywordsChange: 0,
    totalBacklinks: 14200,
    backlinksChange: 8.2,
    referringDomains: 940,
    domainRating: 62,
    crawlHealth: 89,
    device: 'Desktop',
    isPrimary: false,
    assignedTo: 'usr-admin',
    assignedName: 'Admin User'
  }
];

export const searchEngineOptions = [
  { value: 'Google US (google.com)', label: 'Google US (google.com)', country: 'United States', code: 'US' },
  { value: 'Google UK (google.co.uk)', label: 'Google UK (google.co.uk)', country: 'United Kingdom', code: 'GB' },
  { value: 'Google CA (google.ca)', label: 'Google Canada (google.ca)', country: 'Canada', code: 'CA' },
  { value: 'Google DE (google.de)', label: 'Google Germany (google.de)', country: 'Germany', code: 'DE' },
  { value: 'Google FR (google.fr)', label: 'Google France (google.fr)', country: 'France', code: 'FR' },
  { value: 'Google AU (google.com.au)', label: 'Google Australia (google.com.au)', country: 'Australia', code: 'AU' },
  { value: 'Google IN (google.co.in)', label: 'Google India (google.co.in)', country: 'India', code: 'IN' },
  { value: 'Bing Global (bing.com)', label: 'Bing Global (bing.com)', country: 'Global', code: 'GL' }
];

export const countryOptions = [
  { value: 'United States', label: 'United States', code: 'US' },
  { value: 'United Kingdom', label: 'United Kingdom', code: 'GB' },
  { value: 'Canada', label: 'Canada', code: 'CA' },
  { value: 'Germany', label: 'Germany', code: 'DE' },
  { value: 'France', label: 'France', code: 'FR' },
  { value: 'Australia', label: 'Australia', code: 'AU' },
  { value: 'India', label: 'India', code: 'IN' },
  { value: 'Japan', label: 'Japan', code: 'JP' },
  { value: 'Global', label: 'Global', code: 'GL' }
];
