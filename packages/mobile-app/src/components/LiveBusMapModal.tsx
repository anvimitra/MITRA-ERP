import React, { useState, useEffect, useRef } from 'react';
import { ParentLiveBusTracking, FleetLiveInfo, LiveVehicleTelemetry } from '../types';
import { fetchParentBusLiveTracking, fetchFleetLiveTracking } from '../api';
import {
  X,
  Bus,
  Phone,
  Navigation,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Compass,
  MapPin,
  Gauge,
  Clock,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface Props {
  studentId?: string;
  studentName?: string;
  isFleetView?: boolean;
  onClose: () => void;
}

export const LiveBusMapModal: React.FC<Props> = ({
  studentId,
  studentName,
  isFleetView = false,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<ParentLiveBusTracking | null>(null);
  const [fleetData, setFleetData] = useState<FleetLiveInfo | null>(null);
  const [selectedFleetVehicle, setSelectedFleetVehicle] = useState<LiveVehicleTelemetry | null>(null);
  const [lastPingTime, setLastPingTime] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const busMarkersRef = useRef<Map<string, any>>(new Map());
  const stopMarkersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // Poll for live GPS telemetry every 4 seconds
  const loadData = async () => {
    try {
      if (isFleetView) {
        const fleet = await fetchFleetLiveTracking();
        setFleetData(fleet);
        if (fleet.vehicles && fleet.vehicles.length > 0) {
          if (!selectedFleetVehicle) {
            setSelectedFleetVehicle(fleet.vehicles[0]);
          } else {
            const updated = fleet.vehicles.find((v) => v.id === selectedFleetVehicle.id);
            if (updated) setSelectedFleetVehicle(updated);
          }
        }
        setLastPingTime(new Date());
      } else if (studentId) {
        const data = await fetchParentBusLiveTracking(studentId);
        setTrackingData(data);
        setLastPingTime(new Date());
      }
    } catch (err: any) {
      console.warn('GPS telemetry fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [studentId, isFleetView]);

  // Update relative time seconds ago
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date().getTime() - lastPingTime.getTime()) / 1000));
      setSecondsAgo(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastPingTime]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    try {
      // 1. Initialize map instance if not existing
      if (!leafletMapRef.current) {
        const defaultCenter: [number, number] = [26.9124, 75.7873]; // Jaipur fallback coordinates
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView(defaultCenter, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        leafletMapRef.current = map;
      }

      const map = leafletMapRef.current;

      // 2. Clear old markers and polylines
      stopMarkersRef.current.forEach((m) => map.removeLayer(m));
      stopMarkersRef.current = [];
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      const createBusIcon = (isActive: boolean, vehicleNo: string) =>
        L.divIcon({
          className: 'bus-pin',
          html: `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
              <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:${
                isActive ? 'rgba(16,185,129,0.35)' : 'rgba(148,163,184,0.3)'
              };${isActive ? 'animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;' : ''}"></div>
              <div style="width:36px;height:36px;background:${
                isActive ? '#10b981' : '#64748b'
              };border:3px solid #ffffff;border-radius:50%;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:18px;">
                🚌
              </div>
              <div style="margin-top:2px;background:#0f172a;color:#ffffff;font-size:10px;font-weight:900;padding:2px 6px;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.2);white-space:nowrap;">
                ${vehicleNo}
              </div>
            </div>
          `,
          iconSize: [0, 0],
        });

      const createStopIcon = (stopName: string, seq: number, isWardStop: boolean) =>
        L.divIcon({
          className: 'stop-pin',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
              <div style="width:26px;height:26px;background:${
                isWardStop ? '#f59e0b' : '#6366f1'
              };border:2px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:11px;font-weight:900;box-shadow:0 2px 6px rgba(0,0,0,0.25);">
                ${isWardStop ? '★' : seq}
              </div>
              <div style="margin-top:1px;background:${
                isWardStop ? '#78350f' : '#1e1b4b'
              };color:#ffffff;font-size:9px;font-weight:bold;padding:1px 5px;border-radius:4px;white-space:nowrap;">
                ${stopName}
              </div>
            </div>
          `,
          iconSize: [0, 0],
        });

      // 3. Render markers based on view mode
      const boundsLatLngs: [number, number][] = [];

      if (isFleetView && fleetData) {
        // Clear markers no longer in fleet
        const currentIds = new Set(fleetData.vehicles.map((v) => v.id));
        busMarkersRef.current.forEach((marker, id) => {
          if (!currentIds.has(id)) {
            map.removeLayer(marker);
            busMarkersRef.current.delete(id);
          }
        });

        fleetData.vehicles.forEach((veh) => {
          if (veh.currentLat && veh.currentLng) {
            const pos: [number, number] = [veh.currentLat, veh.currentLng];
            boundsLatLngs.push(pos);

            let marker = busMarkersRef.current.get(veh.id);
            if (!marker) {
              marker = L.marker(pos, {
                icon: createBusIcon(Boolean(veh.isTripActive), veh.vehicleNo),
              }).addTo(map);
              marker.on('click', () => setSelectedFleetVehicle(veh));
              busMarkersRef.current.set(veh.id, marker);
            } else {
              marker.setLatLng(pos);
              marker.setIcon(createBusIcon(Boolean(veh.isTripActive), veh.vehicleNo));
            }
          }
        });
      } else if (trackingData && trackingData.hasTransport && trackingData.vehicle) {
        const veh = trackingData.vehicle;
        if (veh.currentLat && veh.currentLng) {
          const pos: [number, number] = [veh.currentLat, veh.currentLng];
          boundsLatLngs.push(pos);

          let marker = busMarkersRef.current.get(veh.id);
          if (!marker) {
            marker = L.marker(pos, {
              icon: createBusIcon(Boolean(veh.isTripActive), veh.vehicleNo),
            }).addTo(map);
            busMarkersRef.current.set(veh.id, marker);
          } else {
            marker.setLatLng(pos);
            marker.setIcon(createBusIcon(Boolean(veh.isTripActive), veh.vehicleNo));
          }
        }

        // Render stops on route
        if (trackingData.allStops && trackingData.allStops.length > 0) {
          // Approximate stop locations near bus if stops don't have explicit GPS coordinates
          const baseLat = veh.currentLat || 26.9124;
          const baseLng = veh.currentLng || 75.7873;

          const routeCoords: [number, number][] = [];
          if (veh.currentLat && veh.currentLng) routeCoords.push([veh.currentLat, veh.currentLng]);

          trackingData.allStops.forEach((s, idx) => {
            // Distribute stops smoothly along the trajectory if not having absolute coords
            const stopLat = baseLat + (idx + 1) * 0.003 * (idx % 2 === 0 ? 1 : -1);
            const stopLng = baseLng + (idx + 1) * 0.0035;
            const isWardStop = trackingData.studentStop?.id === s.id;
            const stopPos: [number, number] = [stopLat, stopLng];

            boundsLatLngs.push(stopPos);
            routeCoords.push(stopPos);

            const stopMarker = L.marker(stopPos, {
              icon: createStopIcon(s.stopName, s.sequenceOrder || idx + 1, isWardStop),
            }).addTo(map);
            stopMarkersRef.current.push(stopMarker);
          });

          // Draw Polyline route path
          if (routeCoords.length > 1) {
            polylineRef.current = L.polyline(routeCoords, {
              color: '#3b82f6',
              weight: 4,
              opacity: 0.7,
              dashArray: '8, 8',
            }).addTo(map);
          }
        }
      }

      if (boundsLatLngs.length > 0) {
        map.fitBounds(boundsLatLngs, { padding: [40, 40], maxZoom: 16 });
      }
    } catch (err: any) {
      console.warn('Leaflet render error:', err);
      setMapError('Map visualization running in radar HUD mode');
    }
  }, [trackingData, fleetData, isFleetView]);

  const activeVehicle = isFleetView
    ? selectedFleetVehicle || fleetData?.vehicles?.[0]
    : trackingData?.vehicle;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[750px] border border-slate-700 animate-slide-up text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-black text-sm text-white">
                  {isFleetView ? 'Institutional Fleet Tracking' : 'Live School Bus Tracking'}
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[11px] text-purple-200">
                {isFleetView
                  ? `${fleetData?.activeTrips || 0} of ${fleetData?.totalVehicles || 0} Buses Active`
                  : studentName
                  ? `Ward: ${studentName}`
                  : 'Real-Time GPS Telemetry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unauthorized / No Bus Assigned Warning for Parents */}
        {!isFleetView && !loading && trackingData && !trackingData.hasTransport && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-950">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-white">No Bus Service Assigned</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                {trackingData.message ||
                  `ERP records indicate that ${studentName || 'this student'} has not been allocated a school bus or route.`}
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] text-slate-300 max-w-xs text-left space-y-1">
              <span className="font-bold text-amber-400 block">How to enable live bus tracking:</span>
              <p>
                1. School Principal se sampark karein aur transport section me student ko bus route aur stop assign karwayein.
              </p>
              <p>2. Bus assign hote hi live GPS location yahan turant dikhne lagegi.</p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
            >
              Close Window
            </button>
          </div>
        )}

        {/* Fleet Multi-Bus Selector Bar */}
        {isFleetView && fleetData && fleetData.vehicles.length > 1 && (
          <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {fleetData.vehicles.map((v) => {
              const isSelected = v.id === activeVehicle?.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedFleetVehicle(v)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      v.isTripActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>{v.vehicleNo}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Live Map Viewport */}
        {(isFleetView || (trackingData && trackingData.hasTransport)) && (
          <div className="relative flex-1 bg-slate-950 overflow-hidden flex flex-col">
            {/* Interactive Leaflet Map Container */}
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Live GPS Telemetry Floating HUD Overlay */}
            <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center justify-between pointer-events-auto">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                      activeVehicle?.isTripActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-xs text-white">
                        {activeVehicle?.vehicleNo || 'Bus In Transit'}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                          activeVehicle?.isTripActive
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {activeVehicle?.isTripActive ? 'Trip Active' : 'At Terminal'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>Speed: <strong className="text-white">{activeVehicle?.currentSpeed || 0} km/h</strong></span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={loadData}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Refresh telemetry"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Vehicle & Driver Contact Sheet */}
            <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 z-20">
              {/* Boarding Stop & Route Info */}
              {!isFleetView && trackingData?.studentStop && (
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Your Ward's Boarding Stop</span>
                      <strong className="text-white">{trackingData.studentStop.stopName}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Morning Pickup</span>
                    <strong className="text-emerald-400 font-black">
                      {trackingData.studentStop.pickupTime}
                    </strong>
                  </div>
                </div>
              )}

              {/* Driver Contact & Calling Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-sm">
                    {activeVehicle?.driverName?.[0] || 'D'}
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-white">
                      {activeVehicle?.driverName || 'Designated Driver'}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {activeVehicle?.driverPhone || 'No Phone Registered'}
                    </p>
                  </div>
                </div>

                {activeVehicle?.driverPhone ? (
                  <a
                    href={`tel:${activeVehicle.driverPhone}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-black rounded-xl shadow-md transition flex items-center space-x-1.5 shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No contact</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
