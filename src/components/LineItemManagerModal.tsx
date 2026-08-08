import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Category, LineItem, YearData } from '../types';

interface LineItemManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearData: YearData;
  onAddLineItem: (categoryId: string, name: string) => void;
  onDeleteLineItem: (lineItemId: string) => void;
}

export const LineItemManagerModal: React.FC<LineItemManagerModalProps> = ({
  isOpen,
  onClose,
  yearData,
  onAddLineItem,
  onDeleteLineItem,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(
    yearData.categories[0]?.id || ''
  );
  const [newItemName, setNewItemName] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && selectedCatId) {
      onAddLineItem(selectedCatId, newItemName.trim());
      setNewItemName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-none max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white p-5 flex items-center justify-between">
          <h3 className="font-black text-base">Manage Financial Line Items</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Add New Form */}
          <form onSubmit={handleSubmit} className="bg-zinc-50 border border-zinc-200 p-4 rounded-none space-y-3">
            <h4 className="text-xs font-black text-black">Add Custom Line Item</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">
                  Category
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full text-xs bg-white border border-zinc-300 rounded-none p-2.5 text-black font-bold focus:outline-none focus:border-black cursor-pointer"
                >
                  {yearData.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">
                  Line Item Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Security Tools"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full text-xs bg-white border border-zinc-300 rounded-none p-2.5 text-black font-bold focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="w-full py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-black text-xs rounded-none flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-white" />
              Add Line Item
            </button>
          </form>

          {/* List of Existing Items */}
          <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
            {yearData.categories.map((cat) => {
              const catItems = yearData.lineItems.filter((i) => i.categoryId === cat.id);
              return (
                <div key={cat.id} className="space-y-1">
                  <p className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">
                    {cat.name}
                  </p>
                  <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-none overflow-hidden bg-white">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="px-3.5 py-2 flex items-center justify-between text-xs hover:bg-zinc-50 transition-colors"
                      >
                        <span className="text-zinc-900 font-bold">{item.name}</span>
                        <button
                          onClick={() => onDeleteLineItem(item.id)}
                          className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Delete line item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
