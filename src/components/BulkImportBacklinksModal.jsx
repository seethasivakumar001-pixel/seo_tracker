import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Download,
  Check,
  Trash2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseBulkImportText, isValidHttpUrl } from '../services/backlinkService';
import toast from 'react-hot-toast';

export function BulkImportBacklinksModal({
  isOpen,
  onClose,
  onImport,
  currentProjectId = 'site-1',
  currentProjectDomain = 'my99exch.ai',
  projectName = 'My99Exch AI Gaming',
  defaultSubmittedUrl = ''
}) {
  const [importTab, setImportTab] = useState('file'); // 'file' | 'text' (default 'file' matching reference image)
  const [pastedText, setPastedText] = useState('');
  const [previewItems, setPreviewItems] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const targetSubmittedUrl = defaultSubmittedUrl || `https://${currentProjectDomain}`;

  // Download Pre-Formatted Sample Excel Sheet (.xlsx)
  const downloadSampleExcel = () => {
    try {
      const headers = [
        'Website Name',
        'Website URL',
        'Submitted URL',
        'Type',
        'Status',
        'Anchor Text',
        'DA'
      ];

      const sampleRows = [
        [
          'Medium Tech Blog',
          'https://medium.com/@dev/top-seo-tools-2026',
          targetSubmittedUrl,
          'Article',
          'Done',
          'AI SEO Suite',
          88
        ],
        [
          'Product Hunt',
          'https://www.producthunt.com/posts/seo-tracker',
          targetSubmittedUrl,
          'Directory',
          'Done',
          'Realtime SERP Tracker',
          92
        ],
        [
          'Quora Answers',
          'https://www.quora.com/best-rank-tracking-tools',
          targetSubmittedUrl,
          'Forum',
          'Undone',
          'Keyword Tracker Tool',
          93
        ],
        [
          'GitHub Resources',
          'https://github.com/topics/seo-automation',
          targetSubmittedUrl,
          'Profile',
          'Done',
          'Open Source SEO',
          96
        ],
        [
          'Dev.to Community',
          'https://dev.to/techlead/modern-seo-stack-guide',
          targetSubmittedUrl,
          'Guest Post',
          'Undone',
          'On-Page Analyzer',
          85
        ]
      ];

      const wsData = [headers, ...sampleRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws['!cols'] = [
        { wch: 22 },
        { wch: 45 },
        { wch: 35 },
        { wch: 15 },
        { wch: 12 },
        { wch: 24 },
        { wch: 8 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Backlink Submissions');

      const fileName = `sample-backlinks-template-${currentProjectDomain.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Sample Excel template downloaded!');
    } catch (err) {
      console.error('Failed to generate sample Excel:', err);
      toast.error('Could not generate sample file. Please try again.');
    }
  };

  // Process File (Excel or CSV)
  const processImportFile = (file) => {
    if (!file) return;

    setIsProcessing(true);
    setImportFileName(file.name);

    const reader = new FileReader();

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.onload = (evt) => {
        try {
          const text = evt.target.result;
          const items = parseBulkImportText(text, targetSubmittedUrl, currentProjectId);
          setPreviewItems(items);
          setIsProcessing(false);
          if (items.length > 0) {
            toast.success(`Parsed ${items.length} backlinks from ${file.name}`);
          } else {
            toast.error('No valid backlinks detected in CSV file');
          }
        } catch (err) {
          setIsProcessing(false);
          toast.error('Error parsing CSV file');
        }
      };
      reader.readAsText(file);
    } else {
      // Excel File (.xlsx, .xls)
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          const items = [];
          for (let i = 0; i < json.length; i++) {
            const row = json[i];
            if (!Array.isArray(row) || row.length === 0) continue;

            // Skip header row if contains column titles
            const firstCell = String(row[0] || '').toLowerCase();
            if (i === 0 && (firstCell.includes('website') || firstCell.includes('url') || firstCell.includes('link')) && !isValidHttpUrl(row[0])) {
              continue;
            }

            const websiteName = row[0] ? String(row[0]).trim() : 'Web Source';
            const websiteUrl = row[1] ? String(row[1]).trim() : '';
            const submittedUrl = row[2] ? String(row[2]).trim() : targetSubmittedUrl;
            const type = row[3] ? String(row[3]).trim() : 'Directory';
            const status = String(row[4] || '').toLowerCase() === 'done' ? 'Done' : 'Undone';
            const anchorText = row[5] ? String(row[5]).trim() : 'Brand Link';
            const da = Number(row[6]) || Math.floor(Math.random() * 40) + 50;

            if (isValidHttpUrl(websiteUrl)) {
              items.push({
                websiteName,
                websiteUrl,
                submittedUrl: isValidHttpUrl(submittedUrl) ? submittedUrl : targetSubmittedUrl,
                type,
                status,
                anchorText,
                da,
                projectId: currentProjectId
              });
            } else if (isValidHttpUrl(websiteName)) {
              // If the URL is in the first column
              items.push({
                websiteName: 'Web Link',
                websiteUrl: websiteName,
                submittedUrl: targetSubmittedUrl,
                type: 'Directory',
                status: 'Undone',
                anchorText: 'Brand Link',
                da: 65,
                projectId: currentProjectId
              });
            }
          }

          setPreviewItems(items);
          setIsProcessing(false);
          if (items.length > 0) {
            toast.success(`Loaded ${items.length} backlinks from Excel`);
          } else {
            toast.error('No valid links found in the selected Excel sheet');
          }
        } catch (err) {
          setIsProcessing(false);
          toast.error('Failed to parse Excel file. Please ensure it is a valid format.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImportFile(file);
    }
  };

  // Handle parsing pasted text
  const handleParseText = () => {
    if (!pastedText.trim()) {
      toast.error('Please paste backlink URLs or CSV lines first');
      return;
    }
    const items = parseBulkImportText(pastedText, targetSubmittedUrl, currentProjectId);
    if (items.length === 0) {
      toast.error('No valid URLs starting with http:// or https:// were detected');
      return;
    }
    setPreviewItems(items);
    toast.success(`Detected ${items.length} backlinks ready for import`);
  };

  const handleRemovePreviewItem = (index) => {
    setPreviewItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCommitImport = () => {
    if (previewItems.length === 0) {
      toast.error('No items to import');
      return;
    }
    onImport(previewItems);
    toast.success(`Successfully imported ${previewItems.length} backlinks!`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ Modal Header ═══ */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span>Import Backlinks & Submissions</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Target Project:{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {currentProjectDomain}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ═══ Green Sample Template Banner ═══ */}
        <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 dark:border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">
              Need a backlink submission template?
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
              Download our pre-formatted sample Excel sheet with backlink submission columns.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadSampleExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-950 dark:text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-sm whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample (.xlsx)</span>
          </button>
        </div>

        {/* ═══ Segmented Tab Switcher ═══ */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setImportTab('file')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition cursor-pointer ${
              importTab === 'file'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Upload Excel / CSV File</span>
          </button>
          <button
            type="button"
            onClick={() => setImportTab('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition cursor-pointer ${
              importTab === 'text'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Paste Text / CSV Rows</span>
          </button>
        </div>

        {/* ═══ Tab 1: File Upload / Drag & Drop ═══ */}
        {importTab === 'file' && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  processImportFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => document.getElementById('backlink-excel-input')?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-300 dark:border-slate-700/80 hover:border-indigo-500/70 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
              }`}
            >
              <input
                id="backlink-excel-input"
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                <UploadCloud className="w-6 h-6 text-slate-400 dark:text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Drag and drop your Excel or CSV file here
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  or <span className="text-indigo-600 dark:text-indigo-400 underline font-medium">browse from your computer</span>
                </p>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm">
                Supports website name, website URL, submitted URL, type, and status columns (e.g. Directory, Guest Post, Profile...)
              </p>
            </div>

            {importFileName && previewItems.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium truncate pr-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    <strong>{importFileName}</strong> — Ready to import{' '}
                    <strong>{previewItems.length}</strong> backlinks.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportFileName('');
                    setPreviewItems([]);
                  }}
                  className="text-slate-400 hover:text-red-500 text-[11px] font-semibold cursor-pointer flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ Tab 2: Paste Text / CSV Rows ═══ */}
        {importTab === 'text' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Paste backlink URLs one per line, or CSV rows (Website Name, Website URL, Submitted URL, Type, Status):
            </p>
            <textarea
              rows={5}
              placeholder={`https://medium.com/@dev/top-tools-2026\nhttps://quora.com/best-seo-platforms\nProduct Hunt, https://producthunt.com/posts/my-tool, ${targetSubmittedUrl}, Directory, Done`}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white resize-y"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleParseText}
                className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
              >
                ⚡ Preview Parsed Items ({pastedText.split('\n').filter(Boolean).length} lines)
              </button>
              {previewItems.length > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ {previewItems.length} valid links detected
                </span>
              )}
            </div>
          </div>
        )}

        {/* ═══ Live Preview Table (when items are loaded) ═══ */}
        {previewItems.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span>Preview Import ({previewItems.length} backlinks ready)</span>
              <button
                type="button"
                onClick={() => setPreviewItems([])}
                className="text-[11px] text-rose-500 hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>

            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-[10px] uppercase text-slate-400 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Website</th>
                    <th className="py-2 px-3">Website URL</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {previewItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      <td className="py-1.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-semibold">{item.websiteName}</td>
                      <td className="py-1.5 px-3 font-mono text-[11px] truncate max-w-[200px] text-indigo-600 dark:text-indigo-400">
                        {item.websiteUrl}
                      </td>
                      <td className="py-1.5 px-3">{item.type}</td>
                      <td className="py-1.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Done'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePreviewItem(idx)}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer p-1 rounded hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ Modal Footer ═══ */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={previewItems.length === 0}
            onClick={handleCommitImport}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Import {previewItems.length} Backlinks
          </button>
        </div>
      </div>
    </div>
  );
}
