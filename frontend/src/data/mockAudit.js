export const mockAuditData = {
  websiteId: 'site-1',
  overallHealthScore: 82,
  previousScore: 78,
  crawlDate: '2026-10-01T06:30:00Z',
  totalPagesCrawled: 248,
  crawlStatus: 'Finished',
  summary: {
    criticalCount: 6,
    warningCount: 14,
    passedCount: 22,
    totalIssues: 42
  },
  categories: {
    seo: { score: 85, passed: 10, warnings: 4, critical: 2 },
    performance: { score: 76, passed: 5, warnings: 6, critical: 2 },
    security: { score: 95, passed: 4, warnings: 1, critical: 0 },
    accessibility: { score: 79, passed: 3, warnings: 3, critical: 2 }
  },
  issues: [
    {
      id: 'issue-1',
      title: 'Missing Title Tag',
      category: 'SEO',
      severity: 'critical',
      affectedPagesCount: 3,
      description: 'Pages missing a `<title>` tag cannot be indexed effectively by Google and result in poor SERP CTR.',
      howToFix: 'Add a concise, unique title tag (50-60 characters) inside the `<head>` section containing the primary target keyword.',
      pages: [
        { url: 'https://techsphere.io/solutions/v2-preview', status: 200, detail: 'No <title> tag found in HTML head', recommendation: 'Add: <title>Next-Gen Data Pipelines v2 | TechSphere</title>' },
        { url: 'https://techsphere.io/legal/subprocessors-2026', status: 200, detail: 'Empty title tag <title></title>', recommendation: 'Add: <title>Authorized Subprocessors (2026) | TechSphere</title>' },
        { url: 'https://techsphere.io/blog/archive/spring-summit', status: 200, detail: 'Missing title tag', recommendation: 'Add: <title>Spring Data Summit Keynotes & Recaps | TechSphere Blog</title>' }
      ]
    },
    {
      id: 'issue-2',
      title: 'Broken Internal Links (404 Errors)',
      category: 'SEO',
      severity: 'critical',
      affectedPagesCount: 5,
      description: 'Internal links leading to 404 error pages waste crawl budget, damage user experience, and break PageRank flow.',
      howToFix: 'Update the broken href attributes to point to valid destination URLs or configure 301 permanent redirects.',
      pages: [
        { url: 'https://techsphere.io/pricing', status: 404, detail: 'Link to /docs/v1/legacy-billing returned 404 Not Found', recommendation: 'Update link target to /docs/billing-and-plans' },
        { url: 'https://techsphere.io/integrations/kafka-postgresql', status: 404, detail: 'Link to /downloads/cli-v2.1.zip failed with 404', recommendation: 'Update link to latest release /downloads/cli-v3.0' },
        { url: 'https://techsphere.io/blog/lakehouse-vs-warehouse-guide', status: 404, detail: 'Anchor "Download Benchmark Whitepaper" points to expired /whitepapers/2024-db-eval.pdf', recommendation: 'Replace link with /benchmarks/cloud-warehouse-2026' },
        { url: 'https://techsphere.io/features/reverse-etl', status: 404, detail: 'Link in footer to /partners/hubspot-app returned 404', recommendation: 'Fix partner link path or remove dead anchor' },
        { url: 'https://techsphere.io/customers/fintech-case-study', status: 404, detail: 'CTA button points to /demo/book-live which is missing', recommendation: 'Redirect /demo/book-live to /demo or fix route' }
      ]
    },
    {
      id: 'issue-3',
      title: 'Duplicate Title Tags',
      category: 'SEO',
      severity: 'critical',
      affectedPagesCount: 4,
      description: 'Multiple pages sharing identical title tags cause keyword cannibalization and confuse search engine crawlers.',
      howToFix: 'Ensure each indexable URL has a distinct, customized title tag reflecting its unique value proposition.',
      pages: [
        { url: 'https://techsphere.io/products/cloud-data-platform', status: 200, detail: 'Shared title: "TechSphere - Enterprise Cloud Data Platform"', recommendation: 'Keep primary title for product landing page' },
        { url: 'https://techsphere.io/products/cloud-data-platform/features', status: 200, detail: 'Shared title: "TechSphere - Enterprise Cloud Data Platform"', recommendation: 'Change to: "Cloud Data Platform Features & Capabilities | TechSphere"' },
        { url: 'https://techsphere.io/solutions/fintech', status: 200, detail: 'Shared title: "Data Platform Solutions | TechSphere"', recommendation: 'Change to: "Financial Services Data Integration & Compliance | TechSphere"' },
        { url: 'https://techsphere.io/solutions/healthcare', status: 200, detail: 'Shared title: "Data Platform Solutions | TechSphere"', recommendation: 'Change to: "HIPAA Compliant Healthcare Data Platform | TechSphere"' }
      ]
    },
    {
      id: 'issue-4',
      title: 'Slow Server Response Time (TTFB > 800ms)',
      category: 'Performance',
      severity: 'critical',
      affectedPagesCount: 6,
      description: 'Pages taking over 800ms to return the initial byte fail Google Core Web Vitals thresholds and increase bounce rate.',
      howToFix: 'Enable edge CDN caching, optimize database queries, and reduce backend server-side rendering latency.',
      pages: [
        { url: 'https://techsphere.io/benchmarks/cloud-warehouse-2026', status: 200, detail: 'TTFB: 1,420ms (un-cached dynamic calculation)', recommendation: 'Cache benchmark results at the CDN edge (Cloudflare / Fastly)' },
        { url: 'https://techsphere.io/customers', status: 200, detail: 'TTFB: 980ms (heavy unoptimized GraphQL query)', recommendation: 'Implement stale-while-revalidate caching on customer testimonials' },
        { url: 'https://techsphere.io/integrations', status: 200, detail: 'TTFB: 1,150ms (fetching 120 partner logos dynamically)', recommendation: 'Pre-render static integration directory via SSG' },
        { url: 'https://techsphere.io/blog', status: 200, detail: 'TTFB: 890ms', recommendation: 'Optimize blog database index on published_at' },
        { url: 'https://techsphere.io/resources/webinars', status: 200, detail: 'TTFB: 1,020ms', recommendation: 'Cache video metadata API response' },
        { url: 'https://techsphere.io/pricing/calculator', status: 200, detail: 'TTFB: 840ms', recommendation: 'Move pricing calculator logic entirely to client-side JS' }
      ]
    },
    {
      id: 'issue-5',
      title: 'Missing H1 Heading Tag',
      category: 'SEO',
      severity: 'critical',
      affectedPagesCount: 2,
      description: 'A missing `<h1>` header prevents search engines from understanding the core subject of the page.',
      howToFix: 'Include exactly one descriptive `<h1>` element per page matching primary user intent.',
      pages: [
        { url: 'https://techsphere.io/security/whitepaper', status: 200, detail: 'Page starts with <h2> heading instead of <h1>', recommendation: 'Convert main document heading to <h1>Enterprise Data Security Architecture</h1>' },
        { url: 'https://techsphere.io/about/careers/lead-infra-engineer', status: 200, detail: 'Job description title wrapped in <div>', recommendation: 'Wrap job title in semantic <h1> tag' }
      ]
    },
    {
      id: 'issue-6',
      title: 'Missing Meta Description',
      category: 'SEO',
      severity: 'warning',
      affectedPagesCount: 8,
      description: 'Without a meta description, search engines auto-generate snippet text which often looks fragmented in SERPs.',
      howToFix: 'Add a compelling meta description between 120-160 characters summarizing the page and including a call to action.',
      pages: [
        { url: 'https://techsphere.io/features/real-time-pipelines', status: 200, detail: 'Missing meta name="description"', recommendation: 'Add: "Stream, transform, and sync enterprise data in sub-second latency with TechSphere real-time pipelines. Explore live demo."' },
        { url: 'https://techsphere.io/products/vector-engine', status: 200, detail: 'Missing meta description', recommendation: 'Add: "Scale AI embedding search with zero-maintenance managed vector database engine built for sub-millisecond retrieval."' },
        { url: 'https://techsphere.io/compare/fivetran-alternative', status: 200, detail: 'Missing meta description', recommendation: 'Add: "Compare TechSphere vs Fivetran: discover lower TCO, real-time CDC sync, and unlimited enterprise connectors."' },
        { url: 'https://techsphere.io/security/soc2-compliance', status: 200, detail: 'Missing meta description', recommendation: 'Add: "Learn about TechSphere enterprise security certifications including SOC2 Type II, ISO 27001, and HIPAA compliance."' }
      ]
    },
    {
      id: 'issue-7',
      title: 'Images Missing ALT Text',
      category: 'Accessibility',
      severity: 'warning',
      affectedPagesCount: 12,
      description: 'Images without descriptive `alt` attributes harm screen-reader accessibility and miss Google Image Search indexing.',
      howToFix: 'Add meaningful alt attributes describing the visual or purpose of each image.',
      pages: [
        { url: 'https://techsphere.io/products/cloud-data-platform', status: 200, detail: '4 product architecture diagrams missing alt text', recommendation: 'Add alt="Diagram of TechSphere distributed query engine architecture"' },
        { url: 'https://techsphere.io/customers/fintech-case-study', status: 200, detail: 'Customer logo & team hero image missing alt', recommendation: 'Add alt="Fintech Enterprise logo" and alt="Fintech Engineering Team"' },
        { url: 'https://techsphere.io/blog/lakehouse-vs-warehouse-guide', status: 200, detail: '2 benchmark comparison charts missing alt', recommendation: 'Add descriptive alt tags detailing benchmark metrics' }
      ]
    },
    {
      id: 'issue-8',
      title: 'Low Text-to-HTML Ratio (< 10%)',
      category: 'SEO',
      severity: 'warning',
      affectedPagesCount: 4,
      description: 'Excessive inline scripts, bloated styles, or thin content make pages hard for search engines to evaluate.',
      howToFix: 'Extract inline scripts and styles into external bundles and enrich page body copy with valuable content.',
      pages: [
        { url: 'https://techsphere.io/demo', status: 200, detail: 'Text ratio: 4.8% (heavy embedded calendar widget)', recommendation: 'Lazy-load calendar widget and add product summary copy' },
        { url: 'https://techsphere.io/newsletter/subscribe', status: 200, detail: 'Text ratio: 6.2%', recommendation: 'Add recent newsletter archives and topics preview' }
      ]
    },
    {
      id: 'issue-9',
      title: 'Missing OpenGraph & Twitter Social Cards',
      category: 'SEO',
      severity: 'warning',
      affectedPagesCount: 7,
      description: 'Missing `og:image` and `twitter:card` tags prevent rich link previews when shared on Slack, LinkedIn, and Twitter/X.',
      howToFix: 'Add `og:title`, `og:description`, `og:image` (1200x630px) and `twitter:card` meta tags.',
      pages: [
        { url: 'https://techsphere.io/blog/modern-data-stack-costs', status: 200, detail: 'Missing og:image tag', recommendation: 'Add og:image pointing to CDN generated 1200x630 card' },
        { url: 'https://techsphere.io/ai/rag-pipeline-preprocessing', status: 200, detail: 'Missing twitter:card meta', recommendation: 'Add <meta name="twitter:card" content="summary_large_image">' }
      ]
    },
    {
      id: 'issue-10',
      title: 'Mobile Touch Targets Too Small (< 48px)',
      category: 'Accessibility',
      severity: 'warning',
      affectedPagesCount: 5,
      description: 'Buttons and navigation links smaller than 48x48px cause user tapping errors on mobile viewports.',
      howToFix: 'Increase padding and min-height on mobile clickable elements to at least 48px.',
      pages: [
        { url: 'https://techsphere.io/pricing', status: 200, detail: 'Monthly/Annual toggle switch tap area is 28x20px', recommendation: 'Increase button padding to min-h-[44px] min-w-[44px]' },
        { url: 'https://techsphere.io/docs', status: 200, detail: 'Sidebar navigation items have 22px height', recommendation: 'Add py-2.5 on documentation links' }
      ]
    },
    {
      id: 'issue-11',
      title: 'HTTPS Encryption & SSL Certificate Valid',
      category: 'Security',
      severity: 'passed',
      affectedPagesCount: 248,
      description: 'All 248 crawled pages are served over valid TLS 1.3 with HSTS enabled.',
      howToFix: 'None required. Status is optimal.',
      pages: []
    },
    {
      id: 'issue-12',
      title: 'XML Sitemap Found and Accessible',
      category: 'SEO',
      severity: 'passed',
      affectedPagesCount: 248,
      description: 'Sitemap found at https://techsphere.io/sitemap.xml with 248 valid URLs and recent lastmod timestamps.',
      howToFix: 'None required. Status is optimal.',
      pages: []
    },
    {
      id: 'issue-13',
      title: 'Robots.txt Properly Configured',
      category: 'SEO',
      severity: 'passed',
      affectedPagesCount: 248,
      description: 'Robots.txt is valid, non-blocking for key search engine user agents, and references sitemap.xml.',
      howToFix: 'None required. Status is optimal.',
      pages: []
    },
    {
      id: 'issue-14',
      title: 'Canonical Tags Self-Referencing',
      category: 'SEO',
      severity: 'passed',
      affectedPagesCount: 242,
      description: '242 out of 248 pages have valid self-referential canonical tags to prevent duplicate URL indexation.',
      howToFix: 'None required. Status is optimal.',
      pages: []
    }
  ]
};
