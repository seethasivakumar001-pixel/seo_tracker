export const initialNotifications = [
  {
    id: 'notif-1',
    websiteId: 'site-1',
    type: 'ranking_gain',
    category: 'rankings',
    title: 'Major Ranking Surge: "enterprise cloud data platform"',
    message: 'Your primary keyword climbed +2 positions to #2 in Google US (desktop).',
    timestamp: '2026-10-01T07:15:00Z',
    read: false,
    link: '/keywords'
  },
  {
    id: 'notif-2',
    websiteId: 'site-1',
    type: 'new_backlink',
    category: 'backlinks',
    title: 'High-Authority Backlink Detected (DR 92)',
    message: 'TechCrunch featured your platform in "10 Data Engineering Startups Disrupting Cloud Pipelines in 2026".',
    timestamp: '2026-09-30T16:40:00Z',
    read: false,
    link: '/backlinks'
  },
  {
    id: 'notif-3',
    websiteId: 'site-1',
    type: 'ranking_drop',
    category: 'rankings',
    title: 'Ranking Drop Alert: "vector database for semantic search"',
    message: 'Position declined from #5 to #8 (-3 positions). Competitor Pinecone published a new guide.',
    timestamp: '2026-09-29T11:20:00Z',
    read: false,
    link: '/keywords'
  },
  {
    id: 'notif-4',
    websiteId: 'site-1',
    type: 'technical_error',
    category: 'crawl',
    title: '5 New Broken Internal Links Detected',
    message: 'Weekly automated crawl found 5 broken internal links returning HTTP 404 on pricing and blog pages.',
    timestamp: '2026-09-28T09:00:00Z',
    read: true,
    link: '/site-audit'
  },
  {
    id: 'notif-5',
    websiteId: 'site-1',
    type: 'ranking_gain',
    category: 'rankings',
    title: 'Top 3 Achievement: "automated sql schema migration"',
    message: 'Maintained #1 rank for 60 consecutive days with Featured Snippet active.',
    timestamp: '2026-09-27T14:10:00Z',
    read: true,
    link: '/keywords'
  },
  {
    id: 'notif-6',
    websiteId: 'site-1',
    type: 'lost_backlink',
    category: 'backlinks',
    title: 'Backlink Lost from HackerNoon',
    message: 'A referring link from HackerNoon DR 80 was removed during an editorial cleanup.',
    timestamp: '2026-09-26T18:30:00Z',
    read: true,
    link: '/backlinks'
  },
  {
    id: 'notif-7',
    websiteId: 'site-1',
    type: 'crawl_completed',
    category: 'crawl',
    title: 'Site Audit Crawl Completed',
    message: '248 URLs analyzed. SEO Health score increased from 78 to 82/100.',
    timestamp: '2026-09-25T08:00:00Z',
    read: true,
    link: '/site-audit'
  },
  {
    id: 'notif-8',
    websiteId: 'site-1',
    type: 'technical_error',
    category: 'crawl',
    title: 'Mobile Performance Warning: LCP > 2.5s',
    message: 'Mobile Core Web Vitals score dropped due to heavy unoptimized hero images on benchmark page.',
    timestamp: '2026-09-24T12:45:00Z',
    read: true,
    link: '/performance'
  }
];
