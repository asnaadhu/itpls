import React, { useState } from 'react';
import { Check, Copy, Download, ShieldCheck, Upload, X } from 'lucide-react';
import { User, YearData } from '../types';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearData: YearData;
  onImportJSON: (importedData: YearData) => void;
  onExportCSV: () => void;
  currentUser?: User | null;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  yearData,
  onImportJSON,
  onExportCSV,
  currentUser,
}) => {
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const [jsonText, setJsonText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string>('');

  if (!isOpen) return null;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(yearData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyImport = () => {
    if (!canEdit) return;
    try {
      setImportError('');
      const parsed = JSON.parse(jsonText);
      if (!parsed.lineItems || !parsed.months) {
        throw new Error('Invalid financial report format. Missing lineItems or months array.');
      }
      onImportJSON(parsed);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-none max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white p-5 flex items-center justify-between">
          <h3 className="font-black text-base">Backup, Export & Import Data</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-none cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Export Options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onExportCSV}
              className="p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-none text-left transition-all shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-black font-black text-xs">
                <Download className="w-4 h-4 text-emerald-600" />
                Export CSV Spreadsheet
              </div>
              <p className="text-[11px] text-zinc-500 font-medium mt-1">
                Download formatted Excel/Sheets compatible report.
              </p>
            </button>

            <button
              onClick={handleCopyJSON}
              className="p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-none text-left transition-all shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-black font-black text-xs">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-black" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Full JSON Backup'}
              </div>
              <p className="text-[11px] text-zinc-500 font-medium mt-1">
                Copy raw report data for restoring later.
              </p>
            </button>
          </div>

          {/* Import JSON Area */}
          <div className="space-y-2 pt-3 border-t border-zinc-200">
            <label className="text-xs font-black text-black flex items-center justify-between">
              <span>Restore / Import JSON Data</span>
              {!canEdit && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 border border-amber-200">
                  Restricted to Admin / Manager
                </span>
              )}
            </label>
            
            {!canEdit ? (
              <div className="bg-zinc-50 border border-zinc-200 p-4 text-xs text-zinc-600 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>You are logged in as a Viewer. Data import & overwrite operations are disabled.</span>
              </div>
            ) : (
              <>
                <textarea
                  rows={5}
                  placeholder="Paste JSON report backup here..."
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-none p-3.5 text-black focus:outline-none focus:border-black shadow-2xs"
                ></textarea>

                {importError && (
                  <p className="text-xs text-rose-600 font-bold">{importError}</p>
                )}

                <button
                  onClick={handleApplyImport}
                  disabled={!jsonText.trim()}
                  className="w-full py-3 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-black text-xs rounded-none flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-white" />
                  Apply Import & Overwrite
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
