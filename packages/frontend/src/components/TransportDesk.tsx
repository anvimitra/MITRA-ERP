import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import {
  TransportVehicleItem,
  TransportRouteItem,
  StudentTransportItem,
  Student,
} from '../types';
import {
  Edit2,
  Trash2,
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
  Key,
  Copy,
  Check,
} from 'lucide-react';

interface TransportDeskProps {
  students?: Student[];
  school?: { id: string; name: string; code: string } | null;
}

export const TransportDesk: React.FC<TransportDeskProps> = ({ students: propStudents, school }) => {
  const [internalStudents, setInternalStudents] = useState<Student[]>([]);
  const students = (propStudents && propStudents.length > 0) ? propStudents : internalStudents;

  useEffect(() => {
    if (!propStudents || propStudents.length === 0) {
      ApiService.getStudents().then(res => setInternalStudents(res.students || [])).catch(() => {});
    }
  }, [propStudents]);

  const [subTab, setSubTab] = useState<'routes' | 'vehicles' | 'allocations'>('routes');
  // Edit states
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);


  // Vehicles
  const [vehicles, setVehicles] = useState<TransportVehicleItem[]>([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehNo, setVehNo] = useState('');
  const [vehModel, setVehModel] = useState('Tata Starbus 42-Seater');
  const [vehCapacity, setVehCapacity] = useState(42);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverLicense, setDriverLicense] = useState('');

  // Driver credentials modal state
  const [showDriverCredsModal, setShowDriverCredsModal] = useState(false);
  const [createdDriverCreds, setCreatedDriverCreds] = useState<{
    loginId: string;
    password: string;
    driverName: string;
    vehicleNo: string;
    schoolCode?: string;
    schoolName?: string;
  } | null>(null);
  const [copiedDriverCreds, setCopiedDriverCreds] = useState(false);

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

  
  // Vehicle handlers
  const handleOpenAddVehicle = () => {
    setEditingVehicleId(null);
    setVehNo('');
    setVehModel('Tata Starbus 42-Seater');
    setVehCapacity(42);
    setDriverName('');
    setDriverPhone('');
    setDriverLicense('');
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (v: TransportVehicleItem) => {
    setEditingVehicleId(v.id);
    setVehNo(v.vehicleNo);
    setVehModel(v.vehicleModel || 'Tata Starbus 42-Seater');
    setVehCapacity(v.seatingCapacity || 42);
    setDriverName(v.driverName || '');
    setDriverPhone(v.driverPhone || '');
    setDriverLicense(v.driverLicense || '');
    setShowVehicleModal(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from the fleet?')) return;
    try {
      await ApiService.deleteTransportVehicle(id);
      alert('✅ Vehicle removed from fleet!');
      loadAll();
    } catch (err: any) {
      alert('Error deleting vehicle: ' + err.message);
    }
  };

  // Route handlers
  const handleOpenAddRoute = () => {
    setEditingRouteId(null);
    setRouteName('');
    setStartLoc('');
    setEndLoc('');
    setSelectedVehId(vehicles[0]?.id || '');
    setMonthlyFare(2200);
    setShowRouteModal(true);
  };

  const handleOpenEditRoute = (r: TransportRouteItem) => {
    setEditingRouteId(r.id);
    setRouteName(r.routeName);
    setStartLoc(r.startLocation);
    setEndLoc(r.endLocation);
    setSelectedVehId(r.vehicleId || '');
    setMonthlyFare(r.monthlyFare || 2200);
    setShowRouteModal(true);
  };

  const handleDeleteRoute = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this route and its stops?')) return;
    try {
      await ApiService.deleteTransportRoute(id);
      alert('✅ Route deleted!');
      loadAll();
    } catch (err: any) {
      alert('Error deleting route: ' + err.message);
    }
  };

  // Stop handlers
  const handleOpenAddStop = (routeId: string) => {
    setTargetRouteId(routeId);
    setEditingStopId(null);
    setStopName('');
    setPickupTime('07:30 AM');
    setDropTime('02:30 PM');
    setShowStopModal(true);
  };

  const handleOpenEditStop = (routeId: string, stop: any) => {
    setTargetRouteId(routeId);
    setEditingStopId(stop.id);
    setStopName(stop.stopName);
    setPickupTime(stop.pickupTime);
    setDropTime(stop.dropTime);
    setShowStopModal(true);
  };

  const handleDeleteStop = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this stop?')) return;
    try {
      await ApiService.deleteTransportStop(id);
      alert('✅ Stop removed!');
      loadAll();
    } catch (err: any) {
      alert('Error deleting stop: ' + err.message);
    }
  };

  // Allocation handlers
  const handleDeleteAllocation = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this student bus allocation?')) return;
    try {
      await ApiService.deleteStudentTransportAllocation(id);
      alert('✅ Student bus allocation removed!');
      loadAll();
    } catch (err: any) {
      alert('Error removing allocation: ' + err.message);
    }
  };

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

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicleId) {
        const res = await ApiService.updateTransportVehicle(editingVehicleId, {
          vehicleNo: vehNo,
          vehicleModel: vehModel,
          seatingCapacity: vehCapacity,
          driverName,
          driverPhone,
          driverLicense,
        });
        if (res.driverCredentials) {
          setCreatedDriverCreds(res.driverCredentials);
          setShowDriverCredsModal(true);
        } else {
          alert('✅ Vehicle details updated successfully!');
        }
      } else {
        const res = await ApiService.createTransportVehicle({
          vehicleNo: vehNo,
          vehicleModel: vehModel,
          seatingCapacity: vehCapacity,
          driverName,
          driverPhone,
          driverLicense,
        });
        if (res.driverCredentials) {
          setCreatedDriverCreds(res.driverCredentials);
          setShowDriverCredsModal(true);
        } else {
          alert('✅ Vehicle added to fleet successfully!');
        }
      }
      setShowVehicleModal(false);
      setEditingVehicleId(null);
      setVehNo('');
      setDriverName('');
      setDriverPhone('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRouteId) {
        await ApiService.updateTransportRoute(editingRouteId, {
          routeName,
          startLocation: startLoc,
          endLocation: endLoc,
          vehicleId: selectedVehId || undefined,
          monthlyFare,
        });
        alert('✅ Route updated successfully!');
      } else {
        await ApiService.createTransportRoute({
          routeName,
          startLocation: startLoc,
          endLocation: endLoc,
          vehicleId: selectedVehId || undefined,
          monthlyFare,
        });
        alert('✅ Transport route established!');
      }
      setShowRouteModal(false);
      setEditingRouteId(null);
      setRouteName('');
      setStartLoc('');
      setEndLoc('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveStop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStopId) {
        await ApiService.updateTransportStop(editingStopId, {
          stopName,
          pickupTime,
          dropTime,
        });
        alert('✅ Stop schedule updated!');
      } else {
        await ApiService.createTransportStop({
          routeId: targetRouteId,
          stopName,
          pickupTime,
          dropTime,
        });
        alert('✅ Bus stop added to route schedule!');
      }
      setShowStopModal(false);
      setEditingStopId(null);
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
              onClick={handleOpenAddVehicle}
              className="bg-white text-cyan-950 hover:bg-cyan-50 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
            >
              <Plus size={16} />
              <span>Add Fleet Vehicle</span>
            </button>
          )}
          {subTab === 'routes' && (
            <button
              onClick={handleOpenAddRoute}
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
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-black text-cyan-700">₹{r.monthlyFare}/mo</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.vehicleNo}</div>
                  </div>
                  <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
                    <button
                      onClick={() => handleOpenEditRoute(r)}
                      className="p-1 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition"
                      title="Edit Route"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Route"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
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
                    onClick={() => handleOpenAddStop(r.id)}
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
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] text-slate-500 font-mono">
                        Pickup: {s.pickupTime} • Drop: {s.dropTime}
                      </div>
                      <button
                        onClick={() => handleOpenEditStop(r.id, s)}
                        className="text-slate-400 hover:text-cyan-700 p-0.5 rounded transition"
                        title="Edit Stop"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteStop(s.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                        title="Delete Stop"
                      >
                        <Trash2 size={11} />
                      </button>
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
                  <th className="py-3 px-4 text-right">Actions</th>
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
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            const cleanPhone = (v.driverPhone || '').replace(/\D/g, '');
                            const cleanLetters = (v.driverName || 'DRIVER').replace(/[^a-zA-Z]/g, '').toUpperCase();
                            const pfx = (cleanLetters.length >= 4 ? cleanLetters.slice(0, 4) : cleanLetters.padEnd(4, 'D')).toUpperCase();
                            const sfx = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '1234';
                            const autoPassword = (v as any).driverDefaultPassword || `${pfx}${sfx}`;
                            setCreatedDriverCreds({
                              loginId: cleanPhone || v.driverPhone,
                              password: autoPassword,
                              driverName: v.driverName || 'School Bus Driver',
                              vehicleNo: v.vehicleNo,
                              schoolCode: (v as any).schoolCode || school?.code || '',
                              schoolName: (v as any).schoolName || school?.name || 'School ERP',
                            });
                            setShowDriverCredsModal(true);
                          }}
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                          title="View / Copy Driver Mobile App Credentials"
                        >
                          <Key size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenEditVehicle(v)}
                          className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition"
                          title="Edit Vehicle"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Vehicle"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
                  <th className="py-3 px-4 text-right">Actions</th>
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
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteAllocation(a.id)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto"
                        title="Remove Student Bus Seat"
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
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
              <h3 className="text-sm font-black">{editingVehicleId ? "Edit Fleet Vehicle" : "Add Fleet Bus / Van"}</h3>
              <button onClick={() => setShowVehicleModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveVehicle} className="p-5 space-y-3 text-xs">
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

              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-[11px] text-cyan-900 leading-relaxed">
                🔑 <strong>Auto-Generated Driver Login:</strong> A driver account for the <strong>MITRA-ERP All-In-One Mobile App</strong> will automatically be created. The driver can log in using their <strong>Mobile Number</strong> and auto-generated password (Name+Mobile).
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-800 text-white rounded-xl font-bold shadow">{editingVehicleId ? "Update Vehicle" : "Save Vehicle"}</button>
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
              <h3 className="text-sm font-black">{editingRouteId ? "Edit Transport Route" : "Establish Transport Route"}</h3>
              <button onClick={() => setShowRouteModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveRoute} className="p-5 space-y-3 text-xs">
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
                <button type="submit" className="px-4 py-1.5 bg-cyan-800 text-white rounded-xl font-bold shadow">{editingRouteId ? "Update Route" : "Save Route"}</button>
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
              <h3 className="text-sm font-black">{editingStopId ? "Edit Bus Stop" : "Add Bus Stop"}</h3>
              <button onClick={() => setShowStopModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveStop} className="p-5 space-y-3 text-xs">
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
                <button type="submit" className="px-4 py-1.5 bg-cyan-800 text-white rounded-xl font-bold shadow">{editingStopId ? "Update Stop" : "Add Stop"}</button>
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

      {/* ================= MODAL: DRIVER CREDENTIALS AUTO-GENERATED ================= */}
      {showDriverCredsModal && createdDriverCreds && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-cyan-200 space-y-5 animate-slide-up relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-700 text-white flex items-center justify-center font-black shadow-lg shadow-cyan-600/30">
                <Bus size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Driver & Vehicle Registered!</h3>
                <p className="text-xs text-cyan-700 font-bold">✓ Driver Login Credentials Auto-Generated</p>
              </div>
            </div>

            <div className="bg-cyan-50/60 rounded-2xl p-4 border border-cyan-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-cyan-200/60">
                <span className="text-slate-600 font-bold">Driver Name:</span>
                <span className="font-extrabold text-slate-900 uppercase">{createdDriverCreds.driverName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-cyan-200/60">
                <span className="text-slate-600 font-bold">Assigned Bus No:</span>
                <span className="font-mono font-bold text-slate-800">{createdDriverCreds.vehicleNo}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-cyan-200/60">
                <span className="text-slate-600 font-bold">Driver Login ID (Mobile):</span>
                <span className="font-mono font-black text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded-lg text-sm">
                  {createdDriverCreds.loginId}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-cyan-200/60">
                <span className="text-slate-600 font-bold">Auto-Password (Name+Phone):</span>
                <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg text-sm">
                  {createdDriverCreds.password}
                </span>
              </div>
              {createdDriverCreds.schoolCode && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">School Tenant Code:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {createdDriverCreds.schoolCode}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              💡 Driver can log into the <strong>MITRA-ERP All-In-One Mobile App</strong> using their <strong>Mobile Number</strong> as Login ID and the above password to start live GPS trip tracking.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const sName = createdDriverCreds.schoolName || school?.name || 'School ERP';
                  const sCode = createdDriverCreds.schoolCode || school?.code || '';
                  const msg = `🚍 *${sName}*\nDear ${createdDriverCreds.driverName},\nYou have been registered as the Driver for Bus: *${createdDriverCreds.vehicleNo}*.\n\n📱 *MITRA-ERP All-In-One Mobile App Login Details:*\n- *Login ID (Mobile)*: ${createdDriverCreds.loginId}\n- *Password*: ${createdDriverCreds.password}\n${sCode ? `- *School Code*: ${sCode}\n` : ''}\nPlease open the MITRA-ERP Mobile App to log in and start live bus GPS trip tracking.`;
                  navigator.clipboard.writeText(msg);
                  setCopiedDriverCreds(true);
                  setTimeout(() => setCopiedDriverCreds(false), 2500);
                }}
                className="w-full py-3 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl shadow-lg shadow-cyan-700/30 flex items-center justify-center gap-2 transition"
              >
                {copiedDriverCreds ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedDriverCreds ? 'Copied Details to Clipboard!' : '📋 Copy Driver Credentials (WhatsApp / SMS)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDriverCredsModal(false)}
                className="w-full py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
