import React, { useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  FileImage,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { MONTH_NAMES } from '../data/defaultData';
import { YearData } from '../types';

interface ExtractedItem {
  lineItemName: string;
  actual: number;
  budget: number;
  lastYear: number;
}

interface ScreenshotUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearData: YearData;
  activeMonthIndex: number;
  onBulkUpdateMonth: (
    monthIndex: number,
    items: Record<string, { actual: number; budget: number; lastYear: number }>
  ) => void;
  onSelectMonth: (index: number) => void;
}

export const ScreenshotUploadModal: React.FC<ScreenshotUploadModalProps> = ({
  isOpen,
  onClose,
  yearData,
  activeMonthIndex,
  onBulkUpdateMonth,
  onSelectMonth,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extraction results state
  const [extractedMonthName, setExtractedMonthName] = useState<string>('');
  const [targetMonthIndex, setTargetMonthIndex] = useState<number>(activeMonthIndex);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [matchedMapping, setMatchedMapping] = useState<
    Array<{
      systemItemId: string;
      systemItemName: string;
      extractedItemName: string;
      actual: number;
      budget: number;
      lastYear: number;
    }>
  >([]);
  const [isStepReview, setIsStepReview] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    setErrorMessage(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const compressImageForAI = (dataUrl: string, maxDimension = 1600): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          base64: compressedUrl,
          mimeType: 'image/jpeg',
        });
      };
      img.onerror = () => {
        resolve({ base64: dataUrl, mimeType: imageFile?.type || 'image/png' });
      };
      img.src = dataUrl;
    });
  };

  const handleProcessImage = async () => {
    if (!imagePreviewUrl) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Compress image to max 1600px & JPEG to ensure lightweight payload
      const { base64, mimeType } = await compressImageForAI(imagePreviewUrl);

      // 2. Post to backend endpoint
      const response = await fetch('/api/parse-financial-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
        }),
      });

      // 3. Safely read text first to prevent JSON.parse crashes on empty/HTML error bodies
      const responseText = await response.text();
      let resData: any = {};
      try {
        resData = responseText ? JSON.parse(responseText) : {};
      } catch (_e) {
        throw new Error(
          `Server returned non-JSON response (HTTP ${response.status}): ${
            responseText ? responseText.slice(0, 120) : 'Empty response received from server.'
          }`
        );
      }

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || resData.message || 'Failed to extract financial statement data.');
      }

      const { monthName, items } = resData.data || {};

      setExtractedMonthName(monthName || '');
      setExtractedItems(items || []);

      // Attempt to auto-detect month index
      if (monthName) {
        const foundIdx = MONTH_NAMES.findIndex(
          (m) => m.toLowerCase() === monthName.trim().toLowerCase()
        );
        if (foundIdx !== -1) {
          setTargetMonthIndex(foundIdx);
        }
      }

      // Perform matching between extracted items and system line items
      const mappings = mapExtractedItemsToSystem(items || [], yearData);
      setMatchedMapping(mappings);
      setIsStepReview(true);
    } catch (err: any) {
      console.error('Screenshot processing error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while parsing the image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyData = () => {
    const newItems: Record<string, { actual: number; budget: number; lastYear: number }> = {};

    // Get existing month items as base
    const currentMonthData = yearData.months[targetMonthIndex] || yearData.months[0];
    yearData.lineItems.forEach((item) => {
      const existing = currentMonthData.items[item.id] || { actual: 0, budget: 0, lastYear: 0 };
      newItems[item.id] = { ...existing };
    });

    // Overwrite matched items
    matchedMapping.forEach((map) => {
      if (map.systemItemId) {
        newItems[map.systemItemId] = {
          actual: map.actual,
          budget: map.budget,
          lastYear: map.lastYear,
        };
      }
    });

    onBulkUpdateMonth(targetMonthIndex, newItems);
    onSelectMonth(targetMonthIndex);
    onClose();
  };

  const resetModal = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setErrorMessage(null);
    setIsStepReview(false);
    setExtractedItems([]);
    setMatchedMapping([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-none shadow-2xl border border-zinc-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-black text-white p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-800 text-white rounded-none shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black">Auto-Fill Month Data from Screenshot</h2>
              <p className="text-xs text-zinc-400 font-medium">
                Upload a financial statement photo/screenshot to auto-extract Actual, Budget & Last Year figures.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-none text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isStepReview ? (
            /* STEP 1: UPLOAD SCREENSHOT */
            <div className="space-y-5">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-none p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  imagePreviewUrl
                    ? 'border-black bg-zinc-50'
                    : 'border-zinc-300 hover:border-black bg-zinc-50/50 hover:bg-zinc-50'
                }`}
                onClick={() => document.getElementById('screenshotFileInput')?.click()}
              >
                <input
                  id="screenshotFileInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />

                {imagePreviewUrl ? (
                  <div className="space-y-3 w-full max-w-md">
                    <img
                      src={imagePreviewUrl}
                      alt="Selected Screenshot"
                      className="max-h-56 mx-auto rounded-none shadow-md border border-zinc-200 object-contain"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs font-black text-black">
                      <FileImage className="w-4 h-4" />
                      <span>{imageFile?.name || 'Screenshot Selected'}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreviewUrl(null);
                          setImageFile(null);
                        }}
                        className="ml-2 text-rose-600 hover:underline cursor-pointer font-bold"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-black text-white rounded-none flex items-center justify-center mx-auto shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-black">
                        Drag & Drop your financial screenshot here
                      </p>
                      <p className="text-xs text-zinc-500 font-medium mt-1">
                        Supports PNG, JPG, or WebP (e.g., Monthly Actual / Budget / Last Year statement)
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-100 text-black rounded-none text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-none p-4 text-xs text-zinc-600 space-y-1">
                <p className="font-black text-black flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-black" />
                  How AI Auto-Fill Works:
                </p>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 font-medium pl-1">
                  <li>AI Vision reads table headers, row titles, and numerical values for Actual, Budget, and Last Year.</li>
                  <li>Automatically detects the month (e.g. July) or allows you to pick target month.</li>
                  <li>Maps each line item to the department ledger structure and populates figures in one click.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* STEP 2: REVIEW EXTRACTED DATA */
            <div className="space-y-5">
              {/* Target Month Config */}
              <div className="bg-zinc-100 border border-zinc-300 p-4 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-black font-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>AI Extracted {extractedItems.length} line items successfully</span>
                    {extractedMonthName && (
                      <span className="bg-black text-white text-[11px] px-2.5 py-0.5 rounded-none font-bold">
                        Detected: {extractedMonthName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 font-medium mt-0.5">
                    Select which month in the tracker to fill with these numbers:
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-zinc-800">Target Month:</label>
                  <select
                    value={targetMonthIndex}
                    onChange={(e) => setTargetMonthIndex(Number(e.target.value))}
                    className="bg-white border border-zinc-300 text-black font-black text-xs rounded-none px-3 py-1.5 focus:outline-none focus:border-black cursor-pointer"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Matched Line Items Table */}
              <div className="border border-zinc-200 rounded-none overflow-hidden shadow-2xs">
                <div className="bg-zinc-100 px-4 py-2.5 text-xs font-black text-black flex justify-between border-b border-zinc-200">
                  <span>Line Item Mapping Preview</span>
                  <span>{matchedMapping.filter((m) => m.systemItemId).length} / {matchedMapping.length} Items Matched</span>
                </div>
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-800 font-bold sticky top-0 border-b border-zinc-200">
                      <tr>
                        <th className="px-3 py-2 min-w-[200px] font-black">System Line Item</th>
                        <th className="px-3 py-2 min-w-[200px] font-black">Extracted Image Label</th>
                        <th className="px-3 py-2 text-right font-black">Actual ($)</th>
                        <th className="px-3 py-2 text-right font-black">Budget ($)</th>
                        <th className="px-3 py-2 text-right font-black">Last Year ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {matchedMapping.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                          <td className="px-3 py-2 font-bold text-black">
                            {row.systemItemName || <span className="text-zinc-400 italic">Unmatched</span>}
                          </td>
                          <td className="px-3 py-2 text-zinc-600 font-mono text-[11px]">
                            {row.extractedItemName}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                            ${row.actual.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-zinc-800 font-bold">
                            ${row.budget.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-zinc-600 font-medium">
                            ${row.lastYear.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-200 flex items-center justify-between">
          {isStepReview ? (
            <button
              onClick={() => setIsStepReview(false)}
              className="px-4 py-2 border border-zinc-300 text-zinc-800 hover:bg-zinc-100 text-xs font-bold rounded-none transition-all cursor-pointer"
            >
              Back to Upload
            </button>
          ) : (
            <button
              onClick={resetModal}
              disabled={!imagePreviewUrl || isProcessing}
              className="px-4 py-2 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 text-xs font-bold rounded-none transition-all cursor-pointer"
            >
              Clear
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 hover:bg-zinc-200 text-xs font-bold rounded-none transition-all cursor-pointer"
            >
              Cancel
            </button>

            {!isStepReview ? (
              <button
                onClick={handleProcessImage}
                disabled={!imagePreviewUrl || isProcessing}
                className="px-5 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-black rounded-none shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Extracting with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Extract & Process Screenshot</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleApplyData}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-none shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Auto-Fill {MONTH_NAMES[targetMonthIndex]} Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Intelligent mapping function to match extracted items with system line items
function mapExtractedItemsToSystem(extractedItems: ExtractedItem[], yearData: YearData) {
  const result: Array<{
    systemItemId: string;
    systemItemName: string;
    extractedItemName: string;
    actual: number;
    budget: number;
    lastYear: number;
  }> = [];

  const systemItems = yearData.lineItems;

  extractedItems.forEach((ext) => {
    const rawName = ext.lineItemName.toLowerCase().trim();

    // Skip total rows in screenshot if extracted
    if (
      rawName.startsWith('total ') ||
      rawName === 'total expenses' ||
      rawName === 'total labor costs'
    ) {
      return;
    }

    let matchedItem = systemItems.find((s) => s.name.toLowerCase() === rawName);

    if (!matchedItem) {
      // Fuzzy keyword rules
      matchedItem = systemItems.find((s) => {
        const sName = s.name.toLowerCase();
        if (rawName.includes('salaries') && rawName.includes('wages') && s.id === 'item_salaries_wages') return true;
        if (rawName.includes('service charge') && s.id === 'item_service_charge') return true;
        if (rawName.includes('bonus') && s.id === 'item_bonus_incentive') return true;
        if (rawName.includes('contracted') && s.id === 'item_contracted_labor') return true;
        if (rawName.includes('payroll taxes') && s.id === 'item_payroll_taxes') return true;
        if (rawName.includes('supplemental') && s.id === 'item_supplemental_pay') return true;
        if ((rawName.includes('benenfits') || rawName.includes('benefits')) && s.id === 'item_employee_benefits') return true;
        if (rawName.includes('cell phone') && s.id === 'item_cost_cellphones') return true;
        if (rawName.includes('internet') && s.id === 'item_cost_internet') return true;
        if (rawName.includes('local call') && s.id === 'item_cost_local_calls') return true;
        if (rawName.includes('long distance') && s.id === 'item_cost_long_distance') return true;
        if ((rawName.includes('complimentary') || rawName.includes('media')) && s.id === 'item_cost_media_ent') return true;

        if (rawName.includes('administrative') && s.id === 'item_sys_admin') return true;
        if (rawName.includes('centralized') && s.id === 'item_sys_centralized') return true;
        if (rawName.includes('pos') && s.id === 'item_sys_fb_pos') return true;
        if (rawName.includes('hardware') && s.id === 'item_sys_hardware') return true;
        if (rawName.includes('health') && s.id === 'item_sys_health_spa') return true;
        if (rawName.includes('security') && s.id === 'item_sys_info_sec') return true;
        if (rawName.includes('property operation') && s.id === 'item_sys_property_ops') return true;
        if (rawName.includes('rooms') && s.id === 'item_sys_rooms_res') return true;
        if (rawName.includes('sales') && s.id === 'item_sys_sales_mktg') return true;
        if (rawName.includes('telecommunication') && s.id === 'item_sys_telecom') return true;

        if (rawName.includes('cluster') && s.id === 'item_oth_cluster_office') return true;
        if (rawName.includes('dues and subscriptions') && s.id === 'item_oth_dues_sub') return true;
        if (rawName.includes('computer leasing') && s.id === 'item_oth_computer_leasing') return true;
        if (rawName.includes('equipment rental') && s.id === 'item_oth_equip_rental') return true;
        if (rawName.includes('operating supplies') && s.id === 'item_oth_operating_supplies') return true;
        if (rawName.includes('other equipment') && s.id === 'item_oth_other_equipment') return true;
        if (rawName.includes('training') && s.id === 'item_oth_training') return true;
        if (rawName.includes('travel') && s.id === 'item_oth_travel') return true;
        if (rawName.includes('uniform') && s.id === 'item_oth_uniform') return true;
        if (rawName.includes('other it') && s.id === 'item_oth_other_it') return true;

        // Substring inclusions
        if (sName.length > 5 && (rawName.includes(sName) || sName.includes(rawName))) return true;

        return false;
      });
    }

    result.push({
      systemItemId: matchedItem ? matchedItem.id : '',
      systemItemName: matchedItem ? matchedItem.name : '',
      extractedItemName: ext.lineItemName,
      actual: ext.actual || 0,
      budget: ext.budget || 0,
      lastYear: ext.lastYear || 0,
    });
  });

  return result;
}
