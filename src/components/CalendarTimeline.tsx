import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XOctagon, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { Vehicle, VehicleDocument, DOCUMENT_TYPE_LABELS } from '../types';
import { getDaysRemaining, formatDaysRemaining } from '../utils';

interface CalendarTimelineProps {
  documents: VehicleDocument[];
  vehicles: Vehicle[];
  virtualToday?: Date;
}

export const CalendarTimeline: React.FC<CalendarTimelineProps> = ({
  documents,
  vehicles,
  virtualToday,
}) => {
  // Map of vehicle plate numbers for fast lookup
  const vehicleMap = React.useMemo(() => {
    const map: Record<string, Vehicle> = {};
    vehicles.forEach(v => {
      map[v.id] = v;
    });
    return map;
  }, [vehicles]);

  // Exclude paid traffic challans, as they require no timeline expiration action
  const activeExpirations = React.useMemo(() => {
    return documents
      .filter(doc => !(doc.type === 'challan' && doc.isChallanPaid))
      .map(doc => {
        const days = getDaysRemaining(doc.expiryDate, virtualToday);
        return {
          ...doc,
          daysRemaining: days,
          vehicle: vehicleMap[doc.vehicleId],
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [documents, vehicleMap, virtualToday]);

  // Groupings based on criticality
  const expired = activeExpirations.filter(d => d.daysRemaining < 0);
  const critical = activeExpirations.filter(d => d.daysRemaining >= 0 && d.daysRemaining <= 15);
  const warning = activeExpirations.filter(d => d.daysRemaining > 15 && d.daysRemaining <= 45);
  const safe = activeExpirations.filter(d => d.daysRemaining > 45);

  const getUrgencyIcon = (days: number) => {
    if (days < 0) return <XOctagon className="text-red-500" size={16} />;
    if (days <= 15) return <AlertTriangle className="text-rose-500 animate-pulse" size={16} />;
    if (days <= 45) return <Clock className="text-amber-500" size={16} />;
    return <CheckCircle className="text-emerald-500" size={16} />;
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden h-full">
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-zinc-600" />
          <h2 className="text-sm font-semibold text-zinc-900 font-display">Compliance & Renewal Timeline</h2>
        </div>
        <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Urgency Sort</span>
      </div>

      <div className="p-4 space-y-5">
        {/* Row 1: Expired (Red Banner) */}
        {expired.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="flex w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span className="text-xs font-bold text-red-700 uppercase tracking-widest">Immediate Attention ({expired.length})</span>
            </div>
            <div className="space-y-1.5 pl-2 border-l-2 border-red-500">
              {expired.map(item => (
                <div 
                  key={item.id} 
                  className="bg-red-50/50 p-2 rounded-lg border border-red-100 flex items-center justify-between text-xs transition-transform duration-150 hover:translate-x-1"
                >
                  <div>
                    <span className="font-semibold text-red-900 block">
                      {DOCUMENT_TYPE_LABELS[item.type]}
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      Vehicle: <strong className="text-zinc-700 font-mono">{item.vehicle?.plateNumber || 'Unknown'}</strong> ({item.vehicle?.driverName})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-100/80 px-2 py-0.5 rounded-sm">
                    Expired {Math.abs(item.daysRemaining)}d ago
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row 2: Critical Expirations (0-15 Days) */}
        {critical.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="flex w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-xs font-bold text-rose-800 uppercase tracking-widest">Expiry Imminent (0 - 15 Days) ({critical.length})</span>
            </div>
            <div className="space-y-1.5 pl-2 border-l-2 border-rose-400">
              {critical.map(item => (
                <div 
                  key={item.id} 
                  className="bg-rose-50/30 p-2 rounded-lg border border-rose-100 flex items-center justify-between text-xs transition-transform duration-150 hover:translate-x-1"
                >
                  <div>
                    <span className="font-semibold text-zinc-900 block">
                      {DOCUMENT_TYPE_LABELS[item.type]}
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      Vehicle: <span className="font-mono text-zinc-700 font-semibold">{item.vehicle?.plateNumber || 'Unknown'}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-sm">
                    {item.daysRemaining === 0 ? 'Expires Today' : `${item.daysRemaining} days left`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row 3: Warnings (16-45 Days) */}
        {warning.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="flex w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">Due Soon (16 - 45 Days) ({warning.length})</span>
            </div>
            <div className="space-y-1.5 pl-2 border-l-2 border-amber-400">
              {warning.map(item => (
                <div 
                  key={item.id} 
                  className="bg-amber-50/30 p-2 rounded-lg border border-amber-100/70 flex items-center justify-between text-xs transition-transform duration-150 hover:translate-x-1"
                >
                  <div>
                    <span className="font-semibold text-zinc-800 block">
                      {DOCUMENT_TYPE_LABELS[item.type]}
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      Vehicle: <span className="font-mono text-zinc-700">{item.vehicle?.plateNumber || 'Unknown'}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded-sm">
                    {item.daysRemaining} days left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row 4: Fully Secured */}
        {safe.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="flex w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest font-sans">Fully Secured ({safe.length})</span>
            </div>
            <div className="space-y-1.5 pl-2 border-l-2 border-emerald-400 max-h-[160px] overflow-y-auto">
              {safe.map(item => (
                <div 
                  key={item.id} 
                  className="bg-emerald-50/10 p-2 rounded-lg border border-emerald-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-zinc-700 block">
                      {DOCUMENT_TYPE_LABELS[item.type]}
                    </span>
                    <span className="text-zinc-500 text-[10px] font-mono">
                      {item.vehicle?.plateNumber || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {item.daysRemaining} days left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeExpirations.length === 0 && (
          <div className="text-center py-8 text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
            <FileText size={24} className="text-zinc-300" />
            <span>No documents mapped in timeline yet. Create a document or connect a vehicle!</span>
          </div>
        )}
      </div>
    </div>
  );
};
