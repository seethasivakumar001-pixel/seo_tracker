export const BACKLINK_TYPES = [
  'Directory',
  'Guest Post',
  'Profile',
  'Article',
  'Community',
  'Blog Post',
  'Press Release',
  'Resource Page',
  'Review Site',
  'Other'
];

export const BACKLINK_STATUSES = [
  'Done',
  'Undone'
];

export const LINK_ATTRIBUTES = [
  'Dofollow',
  'Nofollow',
  'UGC',
  'Sponsored'
];

// Empty initial mock backlinks dataset
export const initialBacklinks = [];
export const mockBacklinksData = {
  total: 0,
  gained: 0,
  lost: 0,
  referringDomains: 0,
  timeline: [],
  topReferrers: [],
  typesBreakdown: [],
  recentBacklinks: []
};

