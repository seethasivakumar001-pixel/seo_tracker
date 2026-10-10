import { initialBacklinks } from '../data/mockBacklinks';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STORAGE_KEY = 'seo_tracker_backlinks';

// Initialize or fetch all backlinks
export function getAllBacklinks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse backlinks from localStorage:', err);
  }
  return [];
}

export function saveAllBacklinks(backlinks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backlinks));
  } catch (err) {
    console.error('Failed to save backlinks to localStorage:', err);
  }
}

// Get project backlinks (active or including trashed)
export function getProjectBacklinks(projectId, includeDeleted = false) {
  const all = getAllBacklinks();
  return all.filter((b) => {
    const matchProject = b.projectId === projectId || (projectId === 'p1' && b.projectId === 'site-1') || (projectId === 'p2' && b.projectId === 'site-2') || (projectId === 'site-1' && b.projectId === 'p1') || (projectId === 'site-2' && b.projectId === 'p2');
    return matchProject && (includeDeleted || !b.deletedAt);
  });
}

// Check for duplicates
export function checkDuplicateBacklink(websiteUrl, submittedUrl, projectId, excludeId = null) {
  const all = getAllBacklinks();
  const cleanWeb = websiteUrl.trim().toLowerCase().replace(/\/$/, '');
  const cleanSub = submittedUrl.trim().toLowerCase().replace(/\/$/, '');

  const duplicateInProject = all.find(
    (b) =>
      b.id !== excludeId &&
      !b.deletedAt &&
      (b.projectId === projectId || (projectId === 'p1' && b.projectId === 'site-1') || (projectId === 'site-1' && b.projectId === 'p1')) &&
      b.websiteUrl.trim().toLowerCase().replace(/\/$/, '') === cleanWeb &&
      b.submittedUrl.trim().toLowerCase().replace(/\/$/, '') === cleanSub
  );

  if (duplicateInProject) {
    return { isDuplicate: true, scope: 'project', match: duplicateInProject };
  }

  // Cross-project duplicate warning
  const crossProjectMatch = all.find(
    (b) =>
      b.id !== excludeId &&
      !b.deletedAt &&
      b.projectId !== projectId &&
      b.websiteUrl.trim().toLowerCase().replace(/\/$/, '') === cleanWeb
  );

  if (crossProjectMatch) {
    return { isDuplicate: false, hasCrossProjectWarning: true, scope: 'cross-project', match: crossProjectMatch };
  }

  return { isDuplicate: false };
}

// Validate URL format
export function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Simulate Link Verification (Live, Broken, Not Found)
export function mockVerifyLink(backlink) {
  const isHealthy = !backlink.websiteUrl.includes('error') && !backlink.websiteUrl.includes('404');
  const randomOutcome = Math.random();
  let status = 'Live';

  if (!isHealthy || randomOutcome < 0.1) {
    status = 'Broken';
  } else if (randomOutcome < 0.18) {
    status = 'Not found';
  }

  return {
    verificationStatus: status,
    lastChecked: new Date().toISOString().split('T')[0],
    dateVerified: status === 'Live' ? new Date().toISOString().split('T')[0] : backlink.dateVerified
  };
}

// Parse Bulk Imported Text (URLs or CSV)
export function parseBulkImportText(text, defaultSubmittedUrl = '', projectId = 'site-1') {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const results = [];

  for (const line of lines) {
    // Check if line is CSV: WebsiteName, WebsiteUrl, SubmittedUrl, Type, Status
    if (line.includes(',')) {
      const parts = line.split(',').map((p) => p.trim());
      const websiteName = parts[0] || 'Web Link';
      const websiteUrl = parts[1] || '';
      const submittedUrl = parts[2] || defaultSubmittedUrl;
      const type = parts[3] || 'Directory';
      const status = parts[4]?.toLowerCase() === 'done' ? 'Done' : 'Undone';

      if (websiteUrl && isValidHttpUrl(websiteUrl)) {
        results.push({
          websiteName,
          websiteUrl,
          submittedUrl: isValidHttpUrl(submittedUrl) ? submittedUrl : defaultSubmittedUrl,
          type,
          status,
          projectId
        });
      }
    } else {
      // Single URL per line
      const url = line;
      if (isValidHttpUrl(url)) {
        let name = 'Web Source';
        try {
          const u = new URL(url);
          name = u.hostname.replace(/^www\./, '').split('.')[0];
          name = name.charAt(0).toUpperCase() + name.slice(1);
        } catch {}

        results.push({
          websiteName: name,
          websiteUrl: url,
          submittedUrl: defaultSubmittedUrl,
          type: 'Directory',
          status: 'Undone',
          projectId
        });
      }
    }
  }

  return results;
}

// Export to Excel
export function exportBacklinksToExcel(backlinks, projectName = 'SEO Project') {
  const rows = backlinks.map((b, idx) => ({
    'S.No': idx + 1,
    'Website Name': b.websiteName,
    'Website URL': b.websiteUrl,
    'Submitted URL': b.submittedUrl,
    'Status': b.status,
    'Verification': b.verificationStatus || 'Pending',
    'Type': b.type || 'Directory',
    'Anchor Text': b.anchorText || '–',
    'Attribute': b.linkAttribute || 'Dofollow',
    'DA/DR': b.domainRating || '–',
    'Spam Score': b.spamScore ? `${b.spamScore}%` : '–',
    'Date Submitted': b.dateSubmitted || '–',
    'Last Checked': b.lastChecked || '–',
    'Notes': b.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 38 },
    { wch: 38 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 12 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Backlinks Intelligence');
  const cleanName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  XLSX.writeFile(workbook, `backlinks-${cleanName}-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Export to PDF
export function exportBacklinksToPDF(backlinks, projectName = 'SEO Project') {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Document Header
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(`Backlink Intelligence & Outreach Report: ${projectName}`, 14, 15);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const doneCount = backlinks.filter((b) => b.status === 'Done').length;
  const undoneCount = backlinks.filter((b) => b.status !== 'Done').length;
  const completionPct = backlinks.length > 0 ? Math.round((doneCount / backlinks.length) * 100) : 0;

  doc.text(
    `Total: ${backlinks.length} backlinks | Done: ${doneCount} | Undone: ${undoneCount} | Completion: ${completionPct}% | Generated: ${new Date().toLocaleDateString('en-US')}`,
    14,
    21
  );

  const head = [['S.No', 'Website Name', 'Website URL', 'Submitted URL', 'Status', 'Type', 'DR', 'Verification']];
  const body = backlinks.map((b, idx) => [
    idx + 1,
    b.websiteName,
    b.websiteUrl.length > 40 ? b.websiteUrl.substring(0, 38) + '...' : b.websiteUrl,
    b.submittedUrl.length > 40 ? b.submittedUrl.substring(0, 38) + '...' : b.submittedUrl,
    b.status,
    b.type || 'Directory',
    b.domainRating || '–',
    b.verificationStatus || 'Live'
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 26,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  const cleanName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  doc.save(`backlinks-report-${cleanName}.pdf`);
}
