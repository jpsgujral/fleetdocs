import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Bus, 
  User, 
  Check, 
  X, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Vehicle, VehicleStatus } from '../types';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  onAddVehicle: (newVehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (updated: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
}

export const VehicleManager: React.FC<VehicleManagerProps> = ({
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [plateNumber, setPlateNumber] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [type, setType] = useState('Heavy Cargo Truck');
  const [driverName, setDriverName] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('active');
  
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setPlateNumber('');
    setBrandModel('');
    setType('Heavy Cargo Truck');
    setDriverName('');
    setStatus('active');
    setErrorMsg('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!plateNumber.trim()) {
      setErrorMsg('License Plate Number is required.');
      return;
    }

    // Check duplicate plates
    const isDuplicate = vehicles.some(
      v => v.plateNumber.trim().toUpperCase() === plateNumber.trim().toUpperCase()
    );
    if (isDuplicate) {
      setErrorMsg(`Vehicle with number ${plateNumber.toUpperCase()} already exists.`);
      return;
    }

    if (!brandModel.trim()) {
      setErrorMsg('Brand & Model name is required.');
      return;
    }
    if (!driverName.trim()) {
      setErrorMsg('Assigned Driver name is required.');
      return;
    }

    onAddVehicle({
      plateNumber: plateNumber.trim().toUpperCase(),
      brandModel: brandModel.trim(),
      type,
      driverName: driverName.trim(),
      status,
    });

    setIsAdding(false);
    resetForm();
  };

  const startEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setPlateNumber(v.plateNumber);
    setBrandModel(v.brandModel);
    setType(v.type);
    setDriverName(v.driverName);
    setStatus(v.status);
    setErrorMsg('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !brandModel.trim() || !driverName.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    // Verify plate isn't duplicated with another vehicle
    const isDuplicate = vehicles.some(
      v => v.id !== editingId && v.plateNumber.trim().toUpperCase() === plateNumber.trim().toUpperCase()
    );
    if (isDuplicate) {
      setErrorMsg('This Plate Number is already assigned to another vehicle.');
      return;
    }

    if (editingId) {
      onUpdateVehicle({
        id: editingId,
        plateNumber: plateNumber.trim().toUpperCase(),
        brandModel: brandModel.trim(),
        type,
        driverName: driverName.trim(),
        status,
      });
      setEditingId(null);
      resetForm();
    }
  };

  const confirmDelete = (v: Vehicle) => {
    const doubleCheck = window.confirm(`Are you sure you want to delete ${v.plateNumber} from the fleet? This deletes all associated documents.`);
    if (doubleCheck) {
      onDeleteVehicle(v.id);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden h-full">
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-2">
          <Bus size={18} className="text-zinc-600" />
          <h2 className="text-sm font-semibold text-zinc-900 font-display">Manage Fleet Vehicles ({vehicles.length})</h2>
        </div>
        {!isAdding && !editingId && (
          <button
            id="btn-add-vehicle-toggle"
            onClick={() => { setIsAdding(true); resetForm(); }}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
          >
            <Plus size={14} /> Add Vehicle
          </button>
        )}
      </div>

      <div className="p-4">
        {/* ADD VEHICLE FORM */}
        <AnimatePresence mode="wait">
          {isAdding && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 p-4 border border-zinc-200 bg-zinc-50 rounded-lg overflow-hidden"
              onSubmit={handleCreate}
              id="form-add-vehicle"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Register New Vehicle</span>
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); resetForm(); }}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200"
                >
                  <X size={16} />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Plate Number</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="e.g. MH-12-GQ-4567"
                    value={plateNumber}
                    onChange={e => setPlateNumber(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800 focus:outline-hidden uppercase placeholder-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Brand & Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Signa 4825"
                    value={brandModel}
                    onChange={e => setBrandModel(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Vehicle Class</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800 focus:outline-hidden"
                  >
                    <option value="Heavy Cargo Truck">Heavy Cargo Truck</option>
                    <option value="Light Commercial Vehicle">Light Commercial Vehicle</option>
                    <option value="Box Container Truck">Box Container Truck</option>
                    <option value="Flatbed Trailer">Flatbed Trailer</option>
                    <option value="Refrigerated Van">Refrigerated Van</option>
                    <option value="Fuel Tanker">Fuel Tanker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Assigned Driver</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gurpreet Singh"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Initial Status</label>
                <div className="flex gap-4">
                  {(['active', 'maintenance', 'grounded'] as VehicleStatus[]).map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-xs text-zinc-600 capitalize cursor-pointer">
                      <input
                        type="radio"
                        checked={status === s}
                        onChange={() => setStatus(s)}
                        className="accent-zinc-900"
                      />
                      {s === 'active' ? 'Active' : s === 'maintenance' ? 'In Maintenance' : 'Grounded'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 text-xs font-semibold py-2 bg-zinc-900 border border-transparent hover:bg-zinc-800 text-white rounded transition-colors text-center"
                >
                  Save Vehicle
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 border border-zinc-300 text-zinc-600 hover:bg-zinc-100 rounded text-xs text-center"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}

          {/* EDIT VEHICLE FORM */}
          {editingId && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 p-4 border border-zinc-200 bg-amber-50/20 rounded-lg overflow-hidden"
              onSubmit={handleUpdate}
              id="form-edit-vehicle"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Modify Vehicle Info</span>
                <button
                  type="button"
                  onClick={() => { setEditingId(null); resetForm(); }}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-600"
                >
                  <X size={16} />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Plate Number</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={plateNumber}
                    onChange={e => setPlateNumber(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800 focus:outline-hidden uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Brand & Model</label>
                  <input
                    type="text"
                    required
                    value={brandModel}
                    onChange={e => setBrandModel(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Vehicle Class</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                  >
                    <option value="Heavy Cargo Truck">Heavy Cargo Truck</option>
                    <option value="Light Commercial Vehicle">Light Commercial Vehicle</option>
                    <option value="Box Container Truck">Box Container Truck</option>
                    <option value="Flatbed Trailer">Flatbed Trailer</option>
                    <option value="Refrigerated Van">Refrigerated Van</option>
                    <option value="Fuel Tanker">Fuel Tanker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Assigned Driver</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Operational Status</label>
                <div className="flex gap-4">
                  {(['active', 'maintenance', 'grounded'] as VehicleStatus[]).map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-xs text-zinc-600 capitalize cursor-pointer">
                      <input
                        type="radio"
                        checked={status === s}
                        onChange={() => setStatus(s)}
                        className="accent-zinc-900"
                      />
                      {s === 'active' ? 'Active' : s === 'maintenance' ? 'In Shop' : 'Grounded'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 text-xs font-semibold py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded transition-colors"
                >
                  Apply Change
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingId(null); resetForm(); }}
                  className="px-3 border border-zinc-300 text-zinc-600 hover:bg-zinc-100 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* VEHICLE LIST CARDS */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {vehicles.length === 0 ? (
            <div className="text-center py-6 text-zinc-400 text-xs">
              No vehicles registered in fleet yet. Add your first vehicle above.
            </div>
          ) : (
            vehicles.map((v) => {
              const statusColors = {
                active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-100' },
                maintenance: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-100' },
                grounded: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-100' },
              };
              const config = statusColors[v.status] || statusColors.active;

              return (
                <div
                  key={v.id}
                  id={`vehicle-card-${v.id}`}
                  className="border border-zinc-100 p-3 rounded-lg hover:border-zinc-300 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold tracking-wide bg-zinc-100 py-0.5 px-2 rounded-md text-zinc-800 border border-zinc-200">
                        {v.plateNumber}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {v.status === 'active' ? 'Active' : v.status === 'maintenance' ? 'Maintenance' : 'Grounded'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-800 mb-0.5">{v.brandModel}</p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span>{v.type}</span>
                      <span>•</span>
                      <div className="flex items-center gap-0.5">
                        <User size={10} />
                        <span>Driver: {v.driverName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      id={`btn-edit-vehicle-${v.id}`}
                      onClick={() => startEdit(v)}
                      className="p-1 px-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors"
                      title="Edit vehicle details"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      id={`btn-delete-vehicle-${v.id}`}
                      onClick={() => confirmDelete(v)}
                      className="p-1 px-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                      title="Delete vehicle with all its documents"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
