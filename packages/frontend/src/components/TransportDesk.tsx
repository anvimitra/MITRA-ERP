import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import {
  TransportVehicleItem,
  TransportRouteItem,
  StudentTransportItem,
  Student,
} from '../types';
import {
  Bus,
  MapPin,
  Users,
  Plus,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Navigation,
  Shield,
  Search,
} from 'lucide-react';

interface TransportDeskProps {
  students?: Student[];
}

export const TransportDesk: React.FC<TransportDeskProps> = ({ students: propStudents }) => {
  const [internalStudents, setInternalStudents] = useState<Student[]>([]);
  const students = (propStudents && propStudents.length > 0) ? propStudents : internalStudents;

  useEffect(() => {
    if (!propStudents || propStudents.length === 0) {
      ApiService.getStudents().then(res => setInternalStudents(res.students || [])).catch(() => {});
    }
  }, [propStudents]);

  const [subTab, setSubTab] = useState<'routes' | 'vehicles' | 'allocations'>('routes');

  // Vehicles
  const [vehicles, setVehicles] = useState<TransportVehicleItem[]>([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehNo, setVehNo] = useState('');
  const [vehModel, setVehModel] = useState('Tata Starbus 42-Seater');
  const [vehCapacity, setVehCapacity] = useState(42);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverLicense, setDriverLicense] = useState('');

  // Routes
  const [routes, setRoutes] = useState<TransportRouteItem[]>([]);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [startLoc, setStartLoc] = useState('');
  const [endLoc, setEndLoc] = useState('');
  const [selectedVehId, setSelectedVehId] = useState('');
  const [monthlyFare, setMonthlyFare] = useState(2200);

  // Stop modal
  const [showStopModal, setShowStopModal] = useState(false);
  const [targetRouteId, setTargetRouteId] = useState('');
  const [stopName, setStopName] = useState('');
  const [pickupTime, setPickupTime] = useState('07:30 AM');
  const [dropTime, setDropTime] = useState('02:30 PM');

  // Allocations
  const [allocations, setAllocations] = useState<StudentTransportItem[]>([]);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [allocRouteId, setAllocRouteId] = useState('');
  const [allocStopId, setAllocStopId] = useState('');

  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [vRes, rRes, aRes] = await Promise.all([
        ApiService.getTransportVehicles(),
        ApiService.getTransportRoutes(),
        ApiService.getStudentTransportAllocations(),
      ]);
      setVehicles(vRes.vehicles || []);
      setRoutes(rRes.routes || []);
      setAllocations(aRes.allocations || []);
    } catch (err: any) {
      console.error('Error loading transport data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createTransportVehicle({
        vehicleNo: vehNo,
        vehicleModel: vehModel,
        seatingCapacity: vehCapacity,
        driverName,
        driverPhone,
        driverLicense,
      });
      alert('✅ Vehicle added to fleet!');
      setShowVehicleModal(false);
      setVehNo('');
      setDriverName('');
      setDriverPhone('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createTransportRoute({
        routeName,
        startLocation: startLoc,
        endLocation: endLoc,
        vehicleId: selectedVehId || undefined,
        monthlyFare,
      });
      alert('✅ Transport route established!');
      setShowRouteModal(false);
      setRouteName('');
      setStartLoc('');
      setEndLoc('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createTransportStop({
        routeId: targetRouteId,
        stopName,
        pickupTime,
        dropTime,
      });
      alert('✅ Bus stop added to route schedule!');
      setShowStopModal(false);
      setStopName('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAllocateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !allocRouteId || !allocStopId) {
      alert('Please select student, route, and boarding stop.');
      return;
    }

    try {
      await ApiService.allocateStudentTransport({
        studentId: selectedStudentId,
        routeId: allocRouteId,
        stopId: allocStopId,
      });
      alert('✅ Student successfully assigned to bus route!');
      setShowAllocModal(false);
      setSelectedStudentId('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const activeRouteForStops = routes.find((r) => r.id === allocRouteId);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-cyan-800 via-blue-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Bus size={16} />
            <span>Campus Mobility & Logistics</span>
          </div>
          <h1 className="text-2xl font-black">Transport Fleet & Route Operations</h1>
          <p className="text-xs text-cyan-100 mt-1 max-w-xl">
            Monitor GPS fleet vehicles, manage morning/evening route stop timings, and assign student bus seats with emergency driver contacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'vehicles' && (
            <button
              onClick={() => setShowVehicleModal(true)}
              className="bg-white text-cyan-950 hover:bg-cyan-50 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
            >
              <Plus size={16} />
              <span>Add Fleet Vehicle</span>
            </button>
          )}
          {subTab === 'routes' && (
            <button
              onClick={() => setShowRouteModal(true)}
              className="bg-white text-cyan-950 hover:bg-cyan-50 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
            >
              <Plus size={16} />
              <span>Create New Route</span>
            </button>
          )}
          {subTab === 'allocations' && (
            <button
              onClick={() => setShowAllocModal(true)}
              className="bg-white text-cyan-950 hover:bg-cyan-50 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
            >
              <Plus size={16} />
              <span>Allocate Student Seat</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('routes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'routes'
              ? 'bg-cyan-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Navigation size={16} />
          <span>Routes & Schedules ({routes.length})</span>
        </button>
        <button
          onClick={() => setSubTab('vehicles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'vehicles'
              ? 'bg-cyan-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bus size={16} />
          <span>Vehicles & Drivers ({vehicles.length})</span>
        </button>
        <button
          onClick={() => setSubTab('allocations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'allocations'
              ? 'bg-cyan-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={16} />
          <span>Student Bus Allotments ({allocations.length})</span>
        </button>
      </div>

      {/* ================= 1. ROUTES & STOPS ================= */}
      {subTab === 'routes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((r) => (
            <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{r.routeName}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {r.startLocation} ➔ {r.endLocation}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-cyan-700">₹{r.monthlyFare}/mo</div>
                  <div className="text-[10px] text-slate-400 font-mono">{r.vehicleNo}</div>
                </div>
              </div>

              {/* Driver info */}
              {r.driverName && (
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600">
                  <span>Driver: <strong>{r.driverName}</strong></span>
                  <a href={`tel:${r.driverPhone}`} className="flex items-center gap-1 text-cyan-700 font-bold font-mono">
                    <Phone size={12} />
                    <span>{r.driverPhone}</span>
                  </a>
                </div>
              )}

              {/* Stops list */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase">
                  <span>Scheduled Stops ({r.stops?.length || 0})</span>
                  <button
                    onClick={() => { setTargetRouteId(r.id); setShowStopModal(true); }}
                    className="text-cyan-700 hover:underline flex items-center gap-0.5"
                  >
                    <Plus size={12} />
                    <span>Add Stop</span>
                  </button>
                </div>

                {r.stops?.map((s, idx) => (
                  <div key={s.id || idx} className="flex justify-between items-center py-1 px-2 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-700">{s.stopName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Pickup: {s.pickupTime} • Drop: {s.dropTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= 2. VEHICLES LIST ================= */}
      {subTab === 'vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Bus / Vehicle No</th>
                  <th className="py-3 px-4">Vehicle Model</th>
                  <th className="py-3 px-4">Seating Capacity</th>
                  <th className="py-3 px-4">Assigned Driver</th>
                  <th className="py-3 px-4">Driver Contact Phone</th>
                  <th className="py-3 px-4">Driver License</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-800">
                      {v.vehicleNo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {v.vehicleModel || 'Standard School Bus'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-600">
                      {v.seatingCapacity} Seats
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {v.driverName}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-700">
                      <a href={`tel:${v.driverPhone}`} className="hover:underline">
                        {v.driverPhone}
                      </a>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {v.driverLicense || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 3. STUDENT ALLOCATIONS ================= */}
      {subTab === 'allocations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Route Name</th>
                  <th className="py-3 px-4">Assigned Stop</th>
                  <th className="py-3 px-4">Morning Pickup</th>
                  <th className="py-3 px-4">Bus Vehicle</th>
                  <th className="py-3 px-4">Driver Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{a.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Adm: {a.admissionNo}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {a.className} - {a.sectionName}
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-800">
                      {a.routeName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {a.stopName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {a.pickupTime}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {a.vehicleNo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{a.driverName}</div>
                      <div className="text-[11px] text-cyan-700 font-mono">{a.driverPhone}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-cyan-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Add Fleet Bus / Van</h3>
              <button onClick={() => setShowVehicleModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Vehicle Registration Number *</label>
                <input required value={vehNo} onChange={(e) => setVehNo(e.target.value)} placeholder="e.g. DL-1PB-4521" className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Vehicle Model</label>
                  <input value={vehModel} onChange={(e) => setVehModel(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Capacity (Seats)</label>
                  <input type="number" value={vehCapacity} onChange={(e) => setVehCapacity(Number(e.target.value))} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Driver Name *</label>
                  <input required value={driverName} onChange={(e) => setDriverName(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Driver Phone *</label>
                  <input required value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Driver License No</label>
                <input value={driverLicense} onChange={(e) => setDriverLicense(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-800 text-white rounded-xl font-bold shadow">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-cyan-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Establish Transport Route</h3>
              <button onClick={() => setShowRouteModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddRoute} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Route Name *</label>
                <input required value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="e.g. Route 3: Rohini - Pitampura" className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Start Location *</label>
                  <input required value={startLoc} onChange={(e) => setStartLoc(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">End Destination *</label>
                  <input required value={endLoc} onChange={(e) => setEndLoc(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Assign Bus Vehicle</label>
                  <select value={selectedVehId} onChange={(e) => setSelectedVehId(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl">
                    <option value="">-- Select Bus --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.vehicleNo} ({v.driverName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Monthly Fare (₹)</label>
                  <input type="number" value={monthlyFare} onChange={(e) => setMonthlyFare(Number(e.target.value))} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowRouteModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-800 text-white rounded-xl font-bold shadow">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stop Modal */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-cyan-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Add Bus Stop</h3>
              <button onClick={() => setShowStopModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddStop} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Stop / Landmark Name *</label>
                <input required value={stopName} onChange={(e) => setStopName(e.target.value)} placeholder="e.g. Metro Station Gate 1" className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Morning Pickup Time</label>
                  <input value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Evening Drop Time</label>
                  <input value={dropTime} onChange={(e) => setDropTime(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowStopModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-800 text-white rounded-xl font-bold shadow">Add Stop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Student Modal */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-cyan-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Allocate Student Bus Seat</h3>
              <button onClick={() => setShowAllocModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAllocateStudent} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Student *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} (Adm: {s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Bus Route *</label>
                <select
                  required
                  value={allocRouteId}
                  onChange={(e) => { setAllocRouteId(e.target.value); setAllocStopId(''); }}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeName} ({r.vehicleNo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Boarding / De-boarding Stop *</label>
                <select
                  required
                  value={allocStopId}
                  onChange={(e) => setAllocStopId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">-- Choose Stop --</option>
                  {activeRouteForStops?.stops?.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.stopName} (Pickup: {st.pickupTime})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowAllocModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-800 text-white rounded-xl font-bold shadow">Allocate Seat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
