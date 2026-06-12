import React from 'react';
import { motion } from 'motion/react';
import { 
  Bus, 
  AlertTriangle, 
  Clock, 
  BadgeAlert, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Vehicle, VehicleDocument } from '../types';
import { getDaysRemaining, getExpiryStatus } from '../utils';

interface StatsOverviewProps {
  vehicles: Vehicle[];
  documents: VehicleDocument[];
  warningThreshold: number;
  virtualToday?: Date;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  vehicles,
  documents,
  warningThreshold,
  virtualToday,
}) => {
  // Calculations
  const totalVehicles = vehicles.length;
  const groundedVehicles = vehicles.filter(v => v.status === 'grounded').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;

  const expiredDocs = documents.filter(
    d => getExpiryStatus(d, warningThreshold, virtualToday) === 'expired'
  );
  
  const expiringSoonDocs = documents.filter(
    d => getExpiryStatus(d, warningThreshold, virtualToday) === 'expiring_soon'
  );

  const unpaidChallans = documents.filter(
    d => d.type === 'challan' && !d.isChallanPaid
  );
  const totalChallanAmount = unpaidChallans.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Compliance Rating
  // What percentage of documents are fully valid?
  const totalNonChallanDocs = documents.filter(d => d.type !== 'challan').length;
  const activeNonChallanDocs = documents.filter(
    d => d.type !== 'challan' && getExpiryStatus(d, warningThreshold, virtualToday) === 'valid'
  ).length;
  
  const complianceScore = totalNonChallanDocs > 0 
    ? Math.round((activeNonChallanDocs / totalNonChallanDocs) * 100) 
    : 100;

  // Render a responsive card
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Compliance Health */}
      <motion.div 
        id="stat-card-compliance"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-zinc-500">Compliance Rate</span>
          <div className={`p-2 rounded-lg ${complianceScore >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <TrendingUp size={20} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-zinc-900">{complianceScore}%</span>
            <span className="text-xs text-zinc-400 font-medium font-sans">of RTO docs active</span>
          </div>
          {/* Visual progress bar */}
          <div className="w-full bg-zinc-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              style={{ width: `${complianceScore}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                complianceScore >= 90 ? 'bg-emerald-500' : complianceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>
      </motion.div>

      {/* Card 2: Expiration Alerts */}
      <motion.div 
        id="stat-card-critical"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors duration-200 ${
          expiredDocs.length > 0 ? 'border-red-200 bg-red-50/20' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-zinc-500">Critical Expirations</span>
          <div className={`p-2 rounded-lg ${expiredDocs.length > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-zinc-100 text-zinc-500'}`}>
            <ShieldAlert size={20} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold tracking-tight ${expiredDocs.length > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
              {expiredDocs.length}
            </span>
            <span className="text-xs text-zinc-500 font-medium">Expired documents</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            {expiredDocs.length > 0 
              ? `Requires immediate renewal to legally operate` 
              : 'All vehicles compliant to fly'}
          </p>
        </div>
      </motion.div>

      {/* Card 3: Expiring Soon */}
      <motion.div 
        id="stat-card-expiring"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors duration-200 ${
          expiringSoonDocs.length > 0 ? 'border-amber-200 bg-amber-50/10' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-zinc-500">Expiring Soon</span>
          <div className={`p-2 rounded-lg ${expiringSoonDocs.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-500'}`}>
            <Clock size={20} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-zinc-900">{expiringSoonDocs.length}</span>
            <span className="text-xs text-zinc-500 font-medium">Expires in ≤{warningThreshold} days</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            {expiringSoonDocs.length > 0 
              ? `${expiringSoonDocs.length} certificates on critical countdown` 
              : 'No upcoming expiries soon'}
          </p>
        </div>
      </motion.div>

      {/* Card 4: Unpaid Challans */}
      <motion.div 
        id="stat-card-challans"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-zinc-500">Unpaid Challans</span>
          <div className={`p-2 rounded-lg ${unpaidChallans.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-zinc-100 text-zinc-500'}`}>
            <DollarSign size={20} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-zinc-900">
              ₹{totalChallanAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-zinc-500">{unpaidChallans.length} active violations</span>
            {unpaidChallans.length > 0 && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-rose-50 text-rose-700 animate-pulse">
                Unpaid Fine
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Fleet Stats Banner Row */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-zinc-50 border border-zinc-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bus size={18} className="text-zinc-600" />
          <span className="text-xs font-semibold text-zinc-700 font-sans tracking-wide uppercase">Fleet Status Summary</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-zinc-600 font-medium">{activeVehicles} Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-zinc-600 font-medium">{maintenanceVehicles} In Shop</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span className="text-zinc-600 font-medium">{groundedVehicles} Grounded</span>
          </div>
          <div className="border-l border-zinc-300 h-4 mx-1"></div>
          <span className="text-xs text-zinc-500">
            Total Trucks: <strong className="text-zinc-800">{totalVehicles}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
