import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bus, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  Settings, 
  ShieldCheck, 
  HelpCircle, 
  RefreshCw, 
  Clock, 
  Users,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  MapPin,
  Flame,
  ChevronRight,
  TrendingUp,
  Sliders,
  Bell
} from 'lucide-react';
import { Vehicle, VehicleDocument, DocumentType } from './types';
import { INITIAL_VEHICLES, INITIAL_DOCUMENTS } from './mockData';
import { getDaysRemaining, getExpiryStatus } from './utils';
import { StatsOverview } from './components/StatsOverview';
import { VehicleManager } from './components/VehicleManager';
import { CalendarTimeline } from './components/CalendarTimeline';
import { DocumentManager } from './components/DocumentManager';

export default function App() {
  // Load initial states from localStorage or mockData
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('fleet_vehicles_data');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [documents, setDocuments] = useState<VehicleDocument[]>(() => {
    const saved = localStorage.getItem('fleet_documents_data');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [warningThreshold, setWarningThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('fleet_warning_threshold');
    return saved ? parseInt(saved, 10) : 30; // default 30 days
  });

  // Time-travel simulator state
  const [timeOffsetDays, setTimeOffsetDays] = useState<number>(0);

  // Tab View state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vehicles' | 'documents'>('dashboard');

  // Search/Filters inside Quick Alerts
  const [alertSearch, setAlertSearch] = useState('');

  // Save states to localStorage
  useEffect(() => {
    localStorage.setItem('fleet_vehicles_data', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('fleet_documents_data', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('fleet_warning_threshold', warningThreshold.toString());
  }, [warningThreshold]);

  // Compute calculated values based on potential virtual time travel offset
  const virtualTodayDate = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + timeOffsetDays);
    return today;
  }, [timeOffsetDays]);

  const virtualTodayString = useMemo(() => {
    return virtualTodayDate.toISOString().split('T')[0];
  }, [virtualTodayDate]);

  // Check and automatically flag vehicle status as "grounded" if they have critically expired documents!
  // This simulates automatic active fleet defense of compliance.
  useEffect(() => {
    let updatedNeeded = false;
    const updatedVehicles = vehicles.map(v => {
      // Find all non-challan expired docs for this vehicle
      const hasExpiredDocs = documents.some(
        doc => doc.vehicleId === v.id && 
               doc.type !== 'challan' &&
               getExpiryStatus(doc, warningThreshold, virtualTodayDate) === 'expired'
      );

      // If they have critically expired docs, they MUST be grounded automatically
      if (hasExpiredDocs && v.status === 'active') {
        updatedNeeded = true;
        return { ...v, status: 'grounded' as const };
      }
      
      // If we cleared expired docs but the vehicle is still marked grounded, release them back to active
      if (!hasExpiredDocs && v.status === 'grounded') {
        updatedNeeded = true;
        return { ...v, status: 'active' as const };
      }

      return v;
    });

    if (updatedNeeded) {
      setVehicles(updatedVehicles);
    }
  }, [documents, warningThreshold, virtualTodayDate]);

  // Handle vehicle modifications
  const handleAddVehicle = (newVeh: Omit<Vehicle, 'id'>) => {
    const id = 'v-' + Math.random().toString(36).substring(2, 9);
    setVehicles(prev => [...prev, { ...newVeh, id }]);
  };

  const handleUpdateVehicle = (updated: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
  };

  const handleDeleteVehicle = (id: string) => {
    // Delete the vehicle
    setVehicles(prev => prev.filter(v => v.id !== id));
    // Cascade-delete its mapped documents
    setDocuments(prev => prev.filter(doc => doc.vehicleId !== id));
  };

  // Handle document modifications
  const handleAddDocument = (newDoc: Omit<VehicleDocument, 'id' | 'updatedAt'>) => {
    const id = 'doc-' + Math.random().toString(36).substring(2, 9);
    setDocuments(prev => [...prev, { 
      ...newDoc, 
      id, 
      updatedAt: virtualTodayString 
    }]);
  };

  const handleUpdateDocument = (updated: VehicleDocument) => {
    setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Quick Action: Renew instantly
  const handleQuickRenew = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    // Fast-forward expiry date by exactly +1 year from today's simulation date
    const targetDate = new Date(virtualTodayDate.getTime());
    targetDate.setFullYear(targetDate.getFullYear() + 1);
    
    // Update
    onUpdateDocumentHandler({
      ...doc,
      issueDate: virtualTodayString,
      expiryDate: targetDate.toISOString().split('T')[0],
      updatedAt: virtualTodayString,
      notes: `Quick automated compliance renewal processed on ${virtualTodayString}. ` + (doc.notes || '')
    });
  };

  // Safe handler wrapper to support recursive callback passes
  const onUpdateDocumentHandler = (updated: VehicleDocument) => {
    handleUpdateDocument(updated);
  };

  // Active alarms list (expired + expiring soon) mapped with vehicle info
  const activeUrgentAlarms = useMemo(() => {
    return documents
      .filter(doc => {
        // Exclude paid challans from alerts
        if (doc.type === 'challan' && doc.isChallanPaid) return false;
        
        const status = getExpiryStatus(doc, warningThreshold, virtualTodayDate);
        return status === 'expired' || status === 'expiring_soon';
      })
      .map(doc => {
        const vehicle = vehicles.find(v => v.id === doc.vehicleId);
        const daysLeft = getDaysRemaining(doc.expiryDate, virtualTodayDate);
        const statusClass = getExpiryStatus(doc, warningThreshold, virtualTodayDate);
        return {
          ...doc,
          vehicle,
          daysLeft,
          statusClass
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [documents, vehicles, warningThreshold, virtualTodayDate]);

  // Reset demo state completely
  const handleResetDemoData = () => {
    const finalCheck = window.confirm("This resets vehicles and RTO certificates files back to transport demo layout. Continue?");
    if (finalCheck) {
      localStorage.removeItem('fleet_vehicles_data');
      localStorage.removeItem('fleet_documents_data');
      localStorage.removeItem('fleet_warning_threshold');
      setVehicles(INITIAL_VEHICLES);
      setDocuments(INITIAL_DOCUMENTS);
      setWarningThreshold(30);
      setTimeOffsetDays(0);
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      {/* GLOBAL APPLICATION HEADER BAR */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-2xs">
        <div id="app-main-header" className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-zinc-950 text-white rounded-xl flex items-center justify-center shadow-xs">
              <Bus size={22} className="stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-900 tracking-tight font-display">TransitGuard Fleet Systems</h1>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 tracking-wider px-1.5 py-0.5 rounded-sm uppercase">Pro</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Auto-Alert Compliance & Document Validity Hub</p>
            </div>
          </div>

          {/* MAIN TAB SELECTORS */}
          <div className="flex bg-zinc-100/80 p-0.5 rounded-xl border border-zinc-200">
            <button
              id="tab-btn-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Calendar size={13} /> Compliance Board
            </button>
            <button
              id="tab-btn-vehicles"
              onClick={() => setActiveTab('vehicles')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'vehicles'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Bus size={13} /> Fleet Listing ({vehicles.length})
            </button>
            <button
              id="tab-btn-documents"
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <FileText size={13} /> Repository
            </button>
          </div>

          {/* GLOBAL COMPLIANCE BADGE AND PRESETS RESET */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-100 p-1.5 px-3 rounded-lg text-emerald-800">
              <ShieldCheck size={16} />
              <span className="text-xs font-semibold">Automatic active tracking online</span>
            </div>
            <button
              id="btn-global-reset-demo"
              onClick={handleResetDemoData}
              className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
              title="Reset Database to Default Template"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* AUTOMATED TIME-TRAVEL ALARM SIMULATOR DRAWER / SUB HEADER */}
      <div id="expiry-time-traveler-bar" className="bg-zinc-900 text-zinc-100 border-b border-zinc-850 p-3 shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="text-xs">
              <span className="text-zinc-400 mr-1.5 font-medium">Alarm Engine Calendar:</span>
              <strong className="text-zinc-100 underline decoration-emerald-400 font-mono text-[13px] tracking-wide">
                {virtualTodayDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
              </strong>
              {timeOffsetDays !== 0 && (
                <span className="ml-2 font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] uppercase font-mono animate-pulse">
                  Simulated Offset: +{timeOffsetDays} Days
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest mr-1 font-bold">Fast-Forward Validity Timeline:</span>
            <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
              <button
                id="btn-offset-0"
                onClick={() => setTimeOffsetDays(0)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeOffsetDays === 0 ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Reset To Today
              </button>
              <button
                id="btn-offset-15"
                onClick={() => setTimeOffsetDays(15)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeOffsetDays === 15 ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                +15 Days
              </button>
              <button
                id="btn-offset-30"
                onClick={() => setTimeOffsetDays(30)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeOffsetDays === 30 ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                +30 Days (Demo)
              </button>
              <button
                id="btn-offset-180"
                onClick={() => setTimeOffsetDays(180)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeOffsetDays === 180 ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                +6 Months
              </button>
              <button
                id="btn-offset-365"
                onClick={() => setTimeOffsetDays(365)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeOffsetDays === 365 ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                +1 Year
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CORE CONTAINER INTERFACE */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <StatsOverview 
          vehicles={vehicles} 
          documents={documents} 
          warningThreshold={warningThreshold}
          virtualToday={virtualTodayDate}
        />

        <AnimatePresence mode="wait">
          {/* VIEW TAB 1: COMPLIANCE BOARD */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left & Middle Column (2-grid columns wide on desktop): Expiry timeline & alarms panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Visual chronological timeline */}
                <CalendarTimeline 
                  documents={documents} 
                  vehicles={vehicles} 
                  virtualToday={virtualTodayDate}
                />

                {/* Expiration warning setup config bar */}
                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-3xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-zinc-500" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800">Alert Notification Logic Settings</h4>
                      <p className="text-[10px] text-zinc-400">Specify warnings lookahead horizon before document compliance expires.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-600">Threshold:</span>
                    <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-md border border-zinc-200">
                      {[15, 30, 45, 60].map(val => (
                        <button
                          key={val}
                          onClick={() => setWarningThreshold(val)}
                          className={`text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors ${
                            warningThreshold === val 
                              ? 'bg-zinc-950 text-white shadow-3xs' 
                              : 'text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {val} days
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Real-time automated notifications list (Smart alerts ledger) */}
              <div className="space-y-6" id="dashboard-right-sidebar">
                <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden h-full">
                  <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-amber-600" />
                      <h3 className="text-sm font-semibold text-zinc-900 font-display">Compliance Action Ledger</h3>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-sm">
                      {activeUrgentAlarms.length} Urgent Issues
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Alarms filter query field */}
                    <div className="relative mb-3">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Fuzzy filter alerts..."
                        value={alertSearch}
                        onChange={e => setAlertSearch(e.target.value)}
                        className="w-full text-[11px] pl-7 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden text-zinc-800"
                      />
                    </div>

                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                      {activeUrgentAlarms.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
                          <CheckCircle size={24} className="text-emerald-500" />
                          <p className="font-semibold text-zinc-700">Perfect Compliance</p>
                          <p className="text-[11px]">All non-challan RTO papers are active and well ahead of due dates.</p>
                        </div>
                      ) : (
                        activeUrgentAlarms
                          .filter(al => {
                            const term = alertSearch.toLowerCase();
                            return (
                              al.idNumber.toLowerCase().includes(term) ||
                              al.vehicle?.plateNumber.toLowerCase().includes(term) ||
                              al.notes?.toLowerCase().includes(term) ||
                              al.type.toLowerCase().includes(term)
                            );
                          })
                          .map(al => {
                            const isExpired = al.daysLeft <= 0;
                            return (
                              <div
                                key={al.id}
                                id={`urgent-alert-item-${al.id}`}
                                className={`p-3 rounded-lg border text-xs relative overflow-hidden transition-all hover:scale-[1.01] ${
                                  isExpired 
                                    ? 'border-red-200 bg-red-50/20' 
                                    : 'border-amber-200 bg-amber-50/20'
                                }`}
                              >
                                {isExpired && (
                                  <div className="absolute right-0 top-0 bg-red-600 text-white font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-bl">
                                    Expired Alert
                                  </div>
                                )}

                                <div className="flex items-center gap-1 text-zinc-500 text-[10px] mb-1.5">
                                  <strong className="text-zinc-800 font-mono">{al.vehicle?.plateNumber}</strong>
                                  <span>•</span>
                                  <span>{al.vehicle?.driverName}</span>
                                </div>

                                <h4 className="font-bold text-zinc-800 text-[11px] leading-snug">
                                  {al.type === 'registration' ? 'Registration Certificate' : 
                                   al.type === 'insurance' ? 'Insurance Certificate' :
                                   al.type === 'permit' ? 'Goods Permit Card' : 
                                   al.type === 'road_tax' ? 'Road Usage Tax Record' :
                                   al.type === 'challan' ? 'Unpaid Transit Challan' : 'Fitness Clearance Card'}
                                </h4>

                                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                                  ID Ref: <span className="text-zinc-700">{al.idNumber}</span>
                                </p>

                                <div className="mt-3.5 flex items-center justify-between">
                                  <span className={`font-bold text-[10px] ${isExpired ? 'text-red-700' : 'text-amber-800'}`}>
                                    {isExpired 
                                      ? `Urgent Action: Expired ${Math.abs(al.daysLeft)} ${Math.abs(al.daysLeft) === 1 ? 'day' : 'days'} ago!` 
                                      : `Action Due: Expiry in ${al.daysLeft} days`
                                    }
                                  </span>

                                  {/* Quick Action to instantly process fictitious 1-year renewal */}
                                  <button
                                    id={`quick-renew-btn-${al.id}`}
                                    onClick={() => handleQuickRenew(al.id)}
                                    className="flex items-center gap-1 text-[9px] font-bold py-1 px-2.5 rounded bg-zinc-900 border border-zinc-900 hover:bg-zinc-800 text-white transition-all cursor-pointer"
                                  >
                                    Quick Renew
                                  </button>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW TAB 2: VEHICLE MANAGEMENT */}
          {activeTab === 'vehicles' && (
            <motion.div
              key="vehicles-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Large Vehicle Table / Control block on left (takes 2 cols) */}
              <div className="lg:col-span-2">
                <VehicleManager 
                  vehicles={vehicles}
                  onAddVehicle={handleAddVehicle}
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                />
              </div>

              {/* Informative side panel on right */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Sliders size={18} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">Fleet Operations Guide</h3>
                </div>
                <div className="text-xs text-zinc-500 space-y-3 leading-relaxed">
                  <p>In TransitGuard, operational vehicle statuses are interconnected with RTO document validity:</p>
                  
                  <div className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <p><strong>Active Fleet Operation:</strong> Default for trucks equipped with valid certificates.</p>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <p><strong>Maintenance Shop Mode:</strong> Manually trigger when trucks are in repairs or scheduled inspections.</p>
                  </div>

                  <div className="flex gap-2.5 items-start animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    <p><strong>Automatic Grounding Trigger:</strong> If <span className="font-semibold text-rose-700">even one RTO document expires</span>, TransitGuard dynamically flags the truck as <strong>Grounded</strong> to shield your business from highway penalties and road citations!</p>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] text-zinc-600 flex items-start gap-2.5">
                  <Sparkles size={16} className="text-zinc-600 mt-0.5 shrink-0" />
                  <span><strong>Demo Rule:</strong> Try editing MH-12-GQ-4567, click its documents and renew its expired <em>Insurance policy</em>. You will watch its automatic grounding clear instantly!</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW TAB 3: CERTIFICATES REPOSITORY */}
          {activeTab === 'documents' && (
            <motion.div
              key="documents-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <DocumentManager 
                documents={documents}
                vehicles={vehicles}
                onAddDocument={handleAddDocument}
                onUpdateDocument={handleUpdateDocument}
                onDeleteDocument={handleDeleteDocument}
                warningThreshold={warningThreshold}
                virtualToday={virtualTodayDate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER BAR */}
      <footer className="bg-white border-t border-zinc-200 mt-12 py-5 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 TransitGuard Compliance Engines. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-zinc-500">Secure Client Sandbox Storage Enabled</span>
            <span>•</span>
            <span className="text-zinc-400 hover:text-zinc-600 font-mono">v1.2-Stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
