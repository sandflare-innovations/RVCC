"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Paperclip,
  Upload,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { PriorityLevel, RequestItem, Attachment } from "@/types/procurement";
import { formatCurrency } from "@/lib/formatters";
import { CustomDropdown, DropdownOption } from "@/components/ui/custom-dropdown";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    department: string;
    priority: PriorityLevel;
    requiredByDate: string;
    currency: string;
    items: RequestItem[];
    totalEstimatedAmount: number;
    attachments: Attachment[];
  }) => void;
}

export const CONSTRUCTION_DEPARTMENT_OPTIONS: DropdownOption[] = [
  { value: "Civil & Structural Engineering", label: "Civil & Structural Engineering" },
  { value: "MEP & Electrical Systems", label: "MEP & Electrical Systems" },
  { value: "Heavy Plant & Machinery", label: "Heavy Plant & Equipment" },
  { value: "Architecture & Finishes", label: "Architecture & Finishes" },
  { value: "Site Safety & HSE", label: "Site Safety & HSE" },
  { value: "Infrastructure & Earthworks", label: "Infrastructure & Earthworks" },
];

export const CONSTRUCTION_PRIORITY_OPTIONS: DropdownOption[] = [
  { value: "low", label: "Low - Routine Stock (3-4 weeks)" },
  { value: "medium", label: "Medium - Standard Milestone (1-2 weeks)" },
  { value: "high", label: "High - Critical Path (3-5 days)" },
  { value: "urgent", label: "Urgent - Site Work Stoppage (Immediate)" },
];

export const CONSTRUCTION_CATEGORY_OPTIONS: DropdownOption[] = [
  { value: "Concrete & Masonry", label: "Concrete & Masonry" },
  { value: "Steel & Metalwork", label: "Steel & Rebar Metalwork" },
  { value: "MEP & Electrical", label: "MEP & Electrical Piping/Cables" },
  { value: "Heavy Plant & Equipment", label: "Heavy Plant & Equipment Rental" },
  { value: "Safety & PPE", label: "Safety Gear & PPE" },
  { value: "Site Consumables", label: "Site Consumables & Timber" },
  { value: "Finishing Materials", label: "Finishing & Waterproofing" },
];

export const CONSTRUCTION_UNIT_OPTIONS: DropdownOption[] = [
  { value: "tons", label: "tons" },
  { value: "m³", label: "m³ (Cubic Meters)" },
  { value: "m²", label: "m² (Square Meters)" },
  { value: "meters", label: "meters" },
  { value: "pcs", label: "pcs (Pieces)" },
  { value: "bags", label: "bags (50kg)" },
  { value: "boxes", label: "boxes" },
  { value: "sets", label: "sets" },
  { value: "months", label: "months (Rental)" },
  { value: "shifts", label: "shifts (Equipment)" },
  { value: "trips", label: "trips (Haulage)" },
];

export function NewRequestModal({
  isOpen,
  onClose,
  onSubmit,
}: NewRequestModalProps) {
  // Metadata form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Civil & Structural Engineering");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [requiredByDate, setRequiredByDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0]
  );
  const [currency] = useState("SAR");

  // Dynamic Item List
  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      category: string;
      quantity: number;
      unit: string;
      estimatedUnitPrice: number;
      preferredVendor: string;
      notes: string;
    }>
  >([
    {
      id: "temp-1",
      name: "",
      category: "Concrete & Masonry",
      quantity: 1,
      unit: "m³",
      estimatedUnitPrice: 0,
      preferredVendor: "",
      notes: "",
    },
  ]);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `temp-${Date.now()}`,
        name: "",
        category: "Site Consumables",
        quantity: 1,
        unit: "pcs",
        estimatedUnitPrice: 0,
        preferredVendor: "",
        notes: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: `att-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type || "application/pdf",
      url: "#",
      uploadedAt: new Date().toISOString(),
    }));

    setAttachments([...attachments, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.estimatedUnitPrice) || 0),
      0
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!title.trim()) newErrors.push("Site requisition title is required.");
    if (!description.trim()) newErrors.push("Requisition specification / justification is required.");
    if (!department.trim()) newErrors.push("Site Department is required.");

    const validItems = items.filter((item) => item.name.trim().length > 0);
    if (validItems.length === 0) {
      newErrors.push("Please add at least one material/equipment line item.");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const processedItems: RequestItem[] = items
      .filter((i) => i.name.trim().length > 0)
      .map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        name: item.name,
        category: item.category,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || "pcs",
        estimatedUnitPrice: Number(item.estimatedUnitPrice) || 0,
        totalPrice: (Number(item.quantity) || 1) * (Number(item.estimatedUnitPrice) || 0),
        preferredVendor: item.preferredVendor || undefined,
        notes: item.notes || undefined,
      }));

    const totalEstimatedAmount = processedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

    onSubmit({
      title,
      description,
      department,
      priority,
      requiredByDate,
      currency,
      items: processedItems,
      totalEstimatedAmount,
      attachments,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs sm:p-6">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-zinc-100/90 bg-white shadow-[0_16px_48px_-16px_rgba(15,23,42,0.3)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-7 py-5 bg-zinc-50/80 rounded-t-3xl">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#0073bc]">
              RVCC Construction Requisition
            </div>
            <h2 className="text-xl font-extrabold text-zinc-950 mt-0.5">New Material & Site Request</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 space-y-7">
          {errors.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="h-4 w-4" />
                <span>Please complete the required fields:</span>
              </div>
              <ul className="list-inside list-disc pl-2">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 1: General Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0073bc]">
              1. Site & Project Details
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Requisition Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ready-Mix Concrete Grade C35/45 or ASTM Rebar 25mm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#0073bc] focus:outline-none shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Specification & Project Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Specify construction package, structural drawing reference, or site section..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#0073bc] focus:outline-none shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Department / Trade
                </label>
                <CustomDropdown
                  options={CONSTRUCTION_DEPARTMENT_OPTIONS}
                  value={department}
                  onChange={setDepartment}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Priority / Criticality
                </label>
                <CustomDropdown
                  options={CONSTRUCTION_PRIORITY_OPTIONS}
                  value={priority}
                  onChange={(val) => setPriority(val as PriorityLevel)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Required On-Site Date
                </label>
                <CustomDatePicker
                  value={requiredByDate}
                  onChange={setRequiredByDate}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <hr className="border-zinc-100" />

          {/* Step 2: Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0073bc]">
                  2. Bill of Quantities (BOQ Items)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Specify construction materials, quantities, units, and estimated prices.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#0073bc] hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="h-4 w-4" />
                Add Material / Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-zinc-200/90 bg-zinc-50/70 p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-extrabold text-zinc-900 text-sm">
                      BOQ Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-bold text-xs cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Item
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {/* Material Specification */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Material / Equipment Specification <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ready-Mix Concrete Grade C35/45 (SRC) or ASTM A615 25mm Rebar"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-none"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Category
                      </label>
                      <CustomDropdown
                        options={CONSTRUCTION_CATEGORY_OPTIONS}
                        value={item.category}
                        onChange={(val) => handleItemChange(index, "category", val)}
                        className="w-full"
                      />
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", Math.max(1, parseFloat(e.target.value) || 1))
                          }
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-900 focus:border-[#0073bc] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                          Unit
                        </label>
                        <CustomDropdown
                          options={CONSTRUCTION_UNIT_OPTIONS}
                          value={item.unit}
                          onChange={(val) => handleItemChange(index, "unit", val)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Unit Price & Total Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                          Est. Unit Price (SAR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.estimatedUnitPrice}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "estimatedUnitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-900 focus:border-[#0073bc] focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                          Total Price
                        </label>
                        <div className="rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-extrabold text-emerald-700 font-mono">
                          {formatCurrency((item.quantity || 1) * (item.estimatedUnitPrice || 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Summary Bar */}
            <div className="flex items-center justify-between rounded-2xl bg-blue-50/70 border border-blue-200 p-4">
              <span className="text-xs font-bold text-zinc-700">
                Total Estimated BOQ Value:
              </span>
              <span className="text-lg font-black text-[#0073bc] font-mono">
                {formatCurrency(calculateSubtotal())}
              </span>
            </div>
          </div>

          <hr className="border-zinc-100" />

          {/* Step 3: Attachments - File Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0073bc]">
                  3. Technical Submittals & Quotes
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Upload BBS drawings, mix designs, supplier quotations, or test certificates.
                </p>
              </div>

              {/* Hidden native input and custom trigger button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.dwg"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Paperclip className="h-4 w-4 text-[#0073bc]" />
                Upload Submittal
              </button>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-2.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Paperclip className="h-4 w-4 text-[#0073bc]" />
                      <span className="text-zinc-900 font-bold text-xs">{att.name}</span>
                      <span className="text-zinc-400">
                        ({(att.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-rose-600 hover:text-rose-800 cursor-pointer p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center cursor-pointer hover:bg-zinc-50 transition-colors"
              >
                <Upload className="h-7 w-7 text-zinc-400 mb-1.5" />
                <p className="text-xs font-bold text-zinc-800">
                  Click to browse and upload drawings or vendor quotes
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  PDF, DWG, DOCX, PNG or JPG up to 25MB
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/80 px-7 py-4 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors shadow-2xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-xl bg-[#0073bc] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#005f9e] active:scale-98 transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            Submit Site Requisition
          </button>
        </div>
      </div>
    </div>
  );
}
