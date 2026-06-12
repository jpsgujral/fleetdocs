import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  RotateCcw, 
  Calendar, 
  FileText, 
  Paperclip,
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
  Download,
  UploadCloud,
  X,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  Vehicle, 
  VehicleDocument, 
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  ExpiryStatus
} from '../types';
import { 
  getDaysRemaining, 
  getExpiryStatus, 
  formatDaysRemaining, 
  formatBytes 
} from '../utils';

interface DocumentManagerProps {
  documents: VehicleDocument[];
  vehicles: Vehicle[];
  onAddDocument: (doc: Omit<VehicleDocument, 'id' | 'updatedAt'>) => void;
  onUpdateDocument: (updated: VehicleDocument) => void;
  onDeleteDocument: (id: string) => void;
  warningThreshold: number;
  virtualToday?: Date;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  vehicles,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  warningThreshold,
  virtualToday,
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ExpiryStatus | 'all'>('all');

  // Form states (Add/Renew Modals)
  const [isAdding, setIsAdding] = useState(false);
  const [customRenewDoc, setCustomRenewDoc] = useState<VehicleDocument | null>(null);

  // Form Fields
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formType, setFormType] = useState<DocumentType>('registration');
  const [formIdNumber, setFormIdNumber] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsPaid, setFormIsPaid] = useState(false);
  
  // Simulated File Attachment
  const [dragActive, setDragActive] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{name: string, size: number, type: string} | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formError, setFormError] = useState('');

  // Setup default values when opening the add form
  const handleOpenAddForm = () => {
    if (vehicles.length > 0) {
      setFormVehicleId(vehicles[0].id);
    } else {
      setFormVehicleId('');
    }
    setFormType('registration');
    setFormIdNumber('');
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormAmount('');
    setFormNotes('');
    setFormIsPaid(false);
    setAttachedFile(null);
    setFormError('');
    setIsAdding(true);
  };

  // Setup renewal pre-fill values
  const handleOpenRenewal = (doc: VehicleDocument) => {
    setCustomRenewDoc(doc);
    setFormVehicleId(doc.vehicleId);
    setFormType(doc.type);
    setFormIdNumber(doc.idNumber);
    // Suggest next year's issue and expiry based on old expiry
    setFormIssueDate(new Date().toISOString().split('T')[0]);
    
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setFormExpiryDate(d.toISOString().split('T')[0]);
    
    setFormAmount(doc.amount ? doc.amount.toString() : '');
    setFormNotes(`Renewal for previous ID: ${doc.idNumber}. ` + (doc.notes || ''));
    setFormIsPaid(doc.isChallanPaid || false);
    setAttachedFile(doc.attachment ? { name: doc.attachment.name, size: doc.attachment.size, type: doc.attachment.type } : null);
    setFormError('');
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      attachMockFile(file.name, file.size, file.type);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      attachMockFile(file.name, file.size, file.type);
    }
  };

  const attachMockFile = (name: string, size: number, type: string) => {
    setFileUploading(true);
    setTimeout(() => {
      setAttachedFile({ name, size, type });
      setFileUploading(false);
    }, 800); // realistic short delay
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formVehicleId) {
      setFormError('Please select a vehicle first.');
      return;
    }
    if (!formIdNumber.trim()) {
      setFormError('Document Reference or Identification number is required.');
      return;
    }
    if (!formIssueDate) {
      setFormError('Please select the date of issue.');
      return;
    }
    if (!formExpiryDate) {
      setFormError('Please choose the validity or expiry due date.');
      return;
    }

    const expiryTime = new Date(formExpiryDate).getTime();
    const issueTime = new Date(formIssueDate).getTime();
    if (expiryTime <= issueTime && formType !== 'challan') {
      setFormError('Expiration Date must be after the Issue Date.');
      return;
    }

    const docPayload = {
      vehicleId: formVehicleId,
      type: formType,
      idNumber: formIdNumber.trim(),
      issueDate: formIssueDate,
      expiryDate: formExpiryDate,
      amount: formAmount ? parseFloat(formAmount) : undefined,
      isChallanPaid: formType === 'challan' ? formIsPaid : undefined,
      notes: formNotes.trim(),
      attachment: attachedFile ? {
        name: attachedFile.name,
        size: attachedFile.size,
        type: attachedFile.type,
        uploadedAt: new Date().toISOString().split('T')[0]
      } : undefined
    };

    onAddDocument(docPayload);
    setIsAdding(false);
    setAttachedFile(null);
  };

  const handleUpdateDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRenewDoc) return;

    if (!formIdNumber.trim() || !formIssueDate || !formExpiryDate) {
      setFormError('Identity number, issue date, and expiration date are all required for renewal.');
      return;
    }

    onUpdateDocument({
      ...customRenewDoc,
      idNumber: formIdNumber.trim(),
      issueDate: formIssueDate,
      expiryDate: formExpiryDate,
      amount: formAmount ? parseFloat(formAmount) : undefined,
      isChallanPaid: formType === 'challan' ? formIsPaid : undefined,
      notes: formNotes.trim(),
      attachment: attachedFile ? {
        name: attachedFile.name,
        size: attachedFile.size,
        type: attachedFile.type,
        uploadedAt: new Date().toISOString().split('T')[0]
      } : customRenewDoc.attachment,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    setCustomRenewDoc(null);
    setAttachedFile(null);
  };

  const toggleChallanPaidStatus = (doc: VehicleDocument) => {
    onUpdateDocument({
      ...doc,
      isChallanPaid: !doc.isChallanPaid,
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  // Filter Logic
  const filteredDocuments = documents.filter(doc => {
    // 1. Search Query
    const searchLow = searchQuery.toLowerCase();
    const targetVehicle = vehicles.find(v => v.id === doc.vehicleId);
    const vehicleMatch = targetVehicle 
      ? (targetVehicle.plateNumber.toLowerCase().includes(searchLow) || 
         targetVehicle.brandModel.toLowerCase().includes(searchLow) || 
         targetVehicle.driverName.toLowerCase().includes(searchLow))
      : false;
    
    const idMatch = doc.idNumber.toLowerCase().includes(searchLow);
    const labelMatch = DOCUMENT_TYPE_LABELS[doc.type].toLowerCase().includes(searchLow);
    const notesMatch = doc.notes?.toLowerCase().includes(searchLow) || false;

    const matchesSearch = !searchQuery || vehicleMatch || idMatch || labelMatch || notesMatch;

    // 2. Vehicle ID
    const matchesVehicle = selectedVehicleId === 'all' || doc.vehicleId === selectedVehicleId;

    // 3. Document Type
    const matchesType = selectedType === 'all' || doc.type === selectedType;

    // 4. Status
    const status = getExpiryStatus(doc, warningThreshold, virtualToday);
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

    return matchesSearch && matchesVehicle && matchesType && matchesStatus;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedVehicleId('all');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
      {/* HEADER SECTION */}
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-zinc-600" />
          <h2 className="text-sm font-semibold text-zinc-900 font-display">Document Repository Console</h2>
        </div>
        <button
          id="btn-upload-doc-toggle"
          onClick={handleOpenAddForm}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-all shadow-xs"
        >
          <Plus size={14} /> Upload RTO Document
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/20 grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by plate, ID, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-800 focus:outline-hidden"
          />
        </div>

        {/* Vehicle Select */}
        <div>
          <select
            value={selectedVehicleId}
            onChange={e => setSelectedVehicleId(e.target.value)}
            className="w-full text-xs p-2 bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-800 focus:outline-hidden text-zinc-700"
          >
            <option value="all">🚙 All Fleet Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plateNumber} ({v.driverName})</option>
            ))}
          </select>
        </div>

        {/* Document Type Select */}
        <div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as DocumentType | 'all')}
            className="w-full text-xs p-2 bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-800 focus:outline-hidden text-zinc-700"
          >
            <option value="all">📂 All Document Types</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Expiry Alarm Select */}
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as ExpiryStatus | 'all')}
            className="w-full text-xs p-2 bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-800 focus:outline-hidden text-zinc-700"
          >
            <option value="all">🚨 All Alarm Levels</option>
            <option value="expired">🟥 Critically Expired</option>
            <option value="expiring_soon">🟨 Expiring Soon</option>
            <option value="valid">🟩 Compliant & Active</option>
          </select>

          {/* Reset Filters */}
          <button
            id="btn-reset-filters"
            onClick={resetFilters}
            className="p-2 border border-zinc-300 bg-white hover:bg-zinc-50 rounded-lg text-zinc-500 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* DOCUMENT LIST */}
      <div className="p-4">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg">
            <X size={24} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-xs font-semibold text-zinc-500">No matching documents found</p>
            <p className="text-[11px] text-zinc-400 mt-1">Try relaxing filters or search phrases above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => {
              const vehicle = vehicles.find(v => v.id === doc.vehicleId);
              const days = getDaysRemaining(doc.expiryDate, virtualToday);
              const status = getExpiryStatus(doc, warningThreshold, virtualToday);
              const { text: daysLabel, colorClass, bgClass, borderClass } = formatDaysRemaining(days);

              // Specific Challan Visuals
              const isChallan = doc.type === 'challan';
              const isPaid = doc.isChallanPaid;

              return (
                <div
                  key={doc.id}
                  id={`doc-card-${doc.id}`}
                  className={`border rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                    isChallan && isPaid 
                      ? 'border-emerald-200 bg-emerald-50/5' 
                      : status === 'expired' 
                        ? 'border-l-4 border-l-red-500 bg-red-50/5 border-zinc-200' 
                        : status === 'expiring_soon'
                          ? 'border-l-4 border-l-amber-500 bg-amber-50/5 border-zinc-200'
                          : 'border-l-4 border-l-emerald-500 bg-white border-zinc-200'
                  }`}
                >
                  <div>
                    {/* Visual Status Header */}
                    <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-zinc-100">
                      <div>
                        {vehicle && (
                          <span className="font-mono text-[10px] font-extrabold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded-sm border border-zinc-200 inline-block mr-1">
                            {vehicle.plateNumber}
                          </span>
                        )}
                        <span className="text-[9px] text-zinc-400 font-medium font-sans inline-block">
                          Driver: {vehicle?.driverName || 'N/A'}
                        </span>
                      </div>
                      
                      {isChallan ? (
                        <span className={`text-[10px] px-1.5 py-0.5 font-bold uppercase rounded-sm border ${
                          isPaid 
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-800' 
                            : 'bg-rose-100 border-rose-200 text-rose-800 animate-pulse'
                        }`}>
                          {isPaid ? 'PAID' : 'UNPAID'}
                        </span>
                      ) : (
                        <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded-sm border ${bgClass} ${colorClass} ${borderClass}`}>
                          {daysLabel}
                        </span>
                      )}
                    </div>

                    {/* Document Title & Reference Number */}
                    <h3 className="text-xs font-bold text-zinc-900 tracking-tight leading-tight">
                      {DOCUMENT_TYPE_LABELS[doc.type]}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 mt-1 text-zinc-400">
                      <span className="text-[10px] font-mono select-all">
                        Ref: <strong className="text-zinc-600 font-semibold">{doc.idNumber}</strong>
                      </span>
                    </div>

                    {/* Date Details */}
                    <div className="mt-2.5 space-y-1 text-[11px] text-zinc-500">
                      <div className="flex items-center justify-between">
                        <span>Issued:</span>
                        <strong className="text-zinc-700">{doc.issueDate}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{isChallan ? 'Due Date:' : 'Expiry Date:'}</span>
                        <strong className={`font-semibold ${status === 'expired' && !isPaid ? 'text-red-600' : 'text-zinc-700'}`}>
                          {doc.expiryDate}
                        </strong>
                      </div>
                      {doc.amount !== undefined && (
                        <div className="flex items-center justify-between border-t border-dashed border-zinc-100 pt-1 mt-1">
                          <span>{isChallan ? 'Fine Amount:' : 'Tax/Premium Cost:'}</span>
                          <strong className="text-zinc-800">
                            ₹{doc.amount.toLocaleString('en-IN')}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Attached File Simulation */}
                    {doc.attachment && (
                      <div className="mt-3 p-2 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Paperclip size={12} className="text-zinc-400 shrink-0" />
                          <span className="text-[10px] text-zinc-600 font-medium truncate" title={doc.attachment.name}>
                            {doc.attachment.name}
                          </span>
                        </div>
                        <span className="text-[9px] text-zinc-400 shrink-0">
                          ({formatBytes(doc.attachment.size, 1)})
                        </span>
                      </div>
                    )}

                    {/* Notes block */}
                    {doc.notes && (
                      <div className="mt-3 bg-zinc-50/50 hover:bg-zinc-50 p-2 rounded-lg border border-zinc-100/50">
                        <p className="text-[10px] text-zinc-500 italic line-clamp-2 leading-relaxed">
                          "{doc.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    {/* Delete document */}
                    <button
                      id={`btn-delete-doc-${doc.id}`}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to permanently delete this ${DOCUMENT_TYPE_LABELS[doc.type]}?`)) {
                          onDeleteDocument(doc.id);
                        }
                      }}
                      className="p-1.5 border border-zinc-200 hover:border-red-200 text-zinc-400 hover:text-red-500 rounded-md transition-colors"
                      title="Delete document record"
                    >
                      <Trash2 size={13} />
                    </button>

                    <div className="flex gap-1.5">
                      {/* Challan Mark Paid Button */}
                      {isChallan && (
                        <button
                          id={`btn-pay-challan-${doc.id}`}
                          onClick={() => toggleChallanPaidStatus(doc)}
                          className={`flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                            isPaid 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800'
                          }`}
                        >
                          {isPaid ? 'Reopen unpaid' : 'Mark as Paid'}
                        </button>
                      )}

                      {/* General Renew button */}
                      {!isPaid && (
                        <button
                          id={`btn-renew-doc-${doc.id}`}
                          onClick={() => handleOpenRenewal(doc)}
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 font-semibold transition-all"
                        >
                          <RefreshCw size={10} /> Renew Doc
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD/UPLOAD RTO DOCUMENT MODAL */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 overflow-y-auto"
            id="modal-add-doc"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-zinc-200 rounded-xl max-w-lg w-full shadow-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud size={18} className="text-zinc-600" />
                  <span className="text-sm font-semibold text-zinc-900 font-display">Upload Vehicle RTO Document</span>
                </div>
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveDocument} className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded text-xs text-red-700 flex items-center gap-2">
                    <Info size={14} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Target Vehicle Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Select Active Flipped Vehicle</label>
                  <select
                    required
                    value={formVehicleId}
                    onChange={e => setFormVehicleId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                  >
                    <option value="" disabled>Choose Vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plateNumber} — {v.brandModel} ({v.driverName})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Document Type Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Document Type</label>
                    <select
                      required
                      value={formType}
                      onChange={e => {
                        const t = e.target.value as DocumentType;
                        setFormType(t);
                        // Clear PAID indicator for non-challans
                        if (t !== 'challan') setFormIsPaid(false);
                      }}
                      className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                    >
                      {Object.entries(DOCUMENT_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ref Identification Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Document Reference No</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RC / Policy No"
                      value={formIdNumber}
                      onChange={e => setFormIdNumber(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Issue Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Date of Issue</label>
                    <input
                      type="date"
                      required
                      value={formIssueDate}
                      onChange={e => setFormIssueDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>

                  {/* Expiration Date / Payment Due Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      {formType === 'challan' ? 'Filing Due Date' : 'Certificate Expiry Date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={formExpiryDate}
                      onChange={e => setFormExpiryDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  {/* Amount Value */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      {formType === 'challan' ? 'Fine Fee Amount (INR)' : 'Insurance/Tax Fee (Optional)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={formAmount}
                        onChange={e => setFormAmount(e.target.value)}
                        className="w-full text-xs pl-7 pr-3 py-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Challan Paid Option */}
                  {formType === 'challan' && (
                    <div className="bg-zinc-50 p-2.5 rounded border border-zinc-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-600">Mark Paid Immediately?</span>
                      <input
                        type="checkbox"
                        checked={formIsPaid}
                        onChange={e => setFormIsPaid(e.target.checked)}
                        className="w-4 h-4 accent-zinc-950 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Operational Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Brief observations on renewals, payment receipts..."
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                  />
                </div>

                {/* DRAG & DROP FILE ZONE */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Attach Digital Document Template
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[90px] ${
                      dragActive ? 'border-zinc-800 bg-zinc-50/50' : 'border-zinc-200 hover:border-zinc-400 bg-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="application/pdf,image/*"
                    />
                    
                    {fileUploading ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <Clock size={18} className="text-zinc-400 animate-spin" />
                        <span className="text-xs font-medium text-zinc-500">Injecting digital metadata...</span>
                      </div>
                    ) : attachedFile ? (
                      <div className="flex flex-col items-center gap-1">
                        <FileText size={20} className="text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-800">{attachedFile.name}</span>
                        <span className="text-[10px] text-zinc-400">({formatBytes(attachedFile.size)}) attached</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={20} className="text-zinc-400 mb-1" />
                        <p className="text-xs font-semibold text-zinc-700">Drag & drop files or click to upload</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Supports RTO Scans, PDF, Policy images</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 text-xs font-semibold py-2.5 bg-zinc-900 border border-transparent hover:bg-zinc-800 text-white rounded transition-colors text-center cursor-pointer"
                  >
                    Save & Index Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 border border-zinc-300 text-zinc-600 hover:bg-zinc-100 rounded text-xs select-none cursor-pointer"
                  >
                    Go Back
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENEWAL / DATE UPDATE MODAL */}
      <AnimatePresence>
        {customRenewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 overflow-y-auto"
            id="modal-renew-doc"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-zinc-200 rounded-xl max-w-lg w-full shadow-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-200 bg-amber-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw size={18} className="text-amber-700 animate-spin" />
                  <span className="text-sm font-bold text-amber-800 font-display">
                    Document Renewal Wizard – {DOCUMENT_TYPE_LABELS[customRenewDoc.type]}
                  </span>
                </div>
                <button 
                  onClick={() => setCustomRenewDoc(null)} 
                  className="p-1 rounded hover:bg-amber-100 text-amber-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateDocumentSubmit} className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded text-xs text-red-700 flex items-center gap-2">
                    <Info size={14} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 text-xs text-amber-900 leading-relaxed space-y-1">
                  <p><strong>Fleet Vehicle:</strong> {vehicles.find(v => v.id === customRenewDoc.vehicleId)?.plateNumber} ({vehicles.find(v => v.id === customRenewDoc.vehicleId)?.brandModel})</p>
                  <p><strong>Driver:</strong> {vehicles.find(v => v.id === customRenewDoc.vehicleId)?.driverName}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">New Document Id/Policy Number</label>
                  <input
                    type="text"
                    required
                    value={formIdNumber}
                    onChange={e => setFormIdNumber(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Issue Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Effective Issue Date</label>
                    <input
                      type="date"
                      required
                      value={formIssueDate}
                      onChange={e => setFormIssueDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">New Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={formExpiryDate}
                      onChange={e => setFormExpiryDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  {/* Cost */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Renewal Processing Fees (INR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={formAmount}
                        onChange={e => setFormAmount(e.target.value)}
                        className="w-full text-xs pl-7 pr-3 py-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Attachment renewal */}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const fakeNames = ['policy_scan_renewed.pdf', 'rto_verified_receipt.pdf', 'fitness_stamp_completed.pdf'];
                        const pick = fakeNames[Math.floor(Math.random() * fakeNames.length)];
                        attachMockFile(pick, 1024 * 1024 * Math.random(), 'application/pdf');
                      }}
                      className="w-full text-xs py-2.5 border border-zinc-300 rounded font-semibold hover:bg-zinc-50 text-zinc-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Paperclip size={13} /> Update Scan Record
                    </button>
                    {attachedFile && (
                      <p className="text-[10px] text-emerald-700 font-semibold text-center mt-1 truncate">
                        Attached: {attachedFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Operational Notes</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 text-xs font-semibold py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors text-center cursor-pointer"
                  >
                    Confirm & Update Validity Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCustomRenewDoc(null); setAttachedFile(null); }}
                    className="px-4 border border-zinc-300 text-zinc-600 hover:bg-zinc-100 rounded text-xs select-none cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
