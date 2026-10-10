export const mockPerformanceData = {
  websiteId: 'site-1',
  overallScore: {
    desktop: 94,
    mobile: 78
  },
  categories: {
    desktop: {
      performance: 94,
      accessibility: 96,
      bestPractices: 100,
      seo: 98
    },
    mobile: {
      performance: 78,
      accessibility: 92,
      bestPractices: 96,
      seo: 95
    }
  },
  metrics: {
    desktop: {
      lcp: { value: 1.4, unit: 's', status: 'good', score: 96, threshold: '≤ 2.5s', name: 'Largest Contentful Paint' },
      inp: { value: 85, unit: 'ms', status: 'good', score: 94, threshold: '≤ 200ms', name: 'Interaction to Next Paint' },
      cls: { value: 0.04, unit: '', status: 'good', score: 98, threshold: '≤ 0.1', name: 'Cumulative Layout Shift' },
      fcp: { value: 0.9, unit: 's', status: 'good', score: 97, threshold: '≤ 1.8s', name: 'First Contentful Paint' },
      ttfb: { value: 320, unit: 'ms', status: 'good', score: 92, threshold: '≤ 800ms', name: 'Time to First Byte' }
    },
    mobile: {
      lcp: { value: 2.9, unit: 's', status: 'needs-improvement', score: 72, threshold: '≤ 2.5s', name: 'Largest Contentful Paint' },
      inp: { value: 240, unit: 'ms', status: 'needs-improvement', score: 68, threshold: '≤ 200ms', name: 'Interaction to Next Paint' },
      cls: { value: 0.08, unit: '', status: 'good', score: 88, threshold: '≤ 0.1', name: 'Cumulative Layout Shift' },
      fcp: { value: 2.1, unit: 's', status: 'needs-improvement', score: 74, threshold: '≤ 1.8s', name: 'First Contentful Paint' },
      ttfb: { value: 890, unit: 'ms', status: 'poor', score: 58, threshold: '≤ 800ms', name: 'Time to First Byte' }
    }
  },
  history6m: [
    { month: 'May', desktop: 88, mobile: 68 },
    { month: 'Jun', desktop: 90, mobile: 71 },
    { month: 'Jul', desktop: 91, mobile: 73 },
    { month: 'Aug', desktop: 93, mobile: 75 },
    { month: 'Sep', desktop: 93, mobile: 76 },
    { month: 'Oct', desktop: 94, mobile: 78 }
  ],
  auditedPages: [
    { url: 'https://my99exch.ai/', device: 'Desktop', lcp: '1.8s', inp: '120ms', cls: '0.01', score: 94 },
    { url: 'https://my99exch.ai/sports', device: 'Desktop', lcp: '2.1s', inp: '140ms', cls: '0.02', score: 89 },
    { url: 'https://my99exch.ai/in-play', device: 'Desktop', lcp: '2.4s', inp: '160ms', cls: '0.03', score: 85 },
    { url: 'https://my99exch.ai/casino', device: 'Desktop', lcp: '2.0s', inp: '130ms', cls: '0.02', score: 91 },
    { url: 'https://my99exch.ai/promotions', device: 'Desktop', lcp: '1.6s', inp: '110ms', cls: '0.01', score: 96 }
  ]
};
