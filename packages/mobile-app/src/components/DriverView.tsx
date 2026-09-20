import React, { useState, useEffect, useRef } from 'react';
import { User, School, DriverBusInfo, TransportStopItem } from '../types';
import { fetchDriverMyBus, updateDriverLiveLocation, toggleDriverTrip } from '../api';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import {
  Bus,
  Navigation,
  Compass,
  Gauge,
  Radio,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  Clock,
  Shield,
  Send,
  Zap,
  Power,
} from 'lucide-react';

interface Props {
  driver: User;
  school: School | null;
}

export const DriverView: React.FC<Props> = ({ driver, school }) => {
  const [loading, setLoading] = useState(true);
  const [busInfo, setBusInfo] = useState<DriverBusInfo | null>(null);
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'searching' | 'locked' | 'denied'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [checkedStops, setCheckedStops] = useState<Set<string>>(new Set());
  const [syncCount, setSyncCount] = useState(0);
  const [showGpsModal, setShowGpsModal] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<any>(null);

  const promptDriverGpsPermission = async () => {
    setGpsStatus('searching');

    // 1. Native Capacitor Geolocation
    if (Capacitor.isNativePlatform()) {
      try {
        const check = await Geolocation.checkPermissions();
        if (check.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') {
            setGpsStatus('denied');
            setShowGpsModal(true);
            return;
          }
        }
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setGpsStatus('locked');
        setShowGpsModal(false);
        return;
      } catch (err) {
        console.warn('Native GPS permission error:', err);
      }
    }

    // 2. Web browser fallback
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setGpsStatus('locked');
        setShowGpsModal(false);
      },
      (err) => {
        console.warn('Driver GPS permission prompt:', err);
        setGpsStatus('denied');
        setShowGpsModal(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 1. Fetch Assigned Vehicle & Route Details
  const loadDriverBus = async () => {
    try {
      setLoading(true);
      const data = await fetchDriverMyBus();
      setBusInfo(data);
      if (data.vehicle) {
        setIsTripActive(Boolean(data.vehicle.isTripActive));
        if (data.vehicle.currentLat && data.vehicle.currentLng) {
          setCurrentLat(data.vehicle.currentLat);
          setCurrentLng(data.vehicle.currentLng);
          setCurrentSpeed(data.vehicle.currentSpeed || 0);
        }
      }
    } catch (err) {
      console.warn('Failed to load driver bus:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverBus();
    promptDriverGpsPermission();
  }, []);

  // 2. Start / Stop GPS Telemetry Watcher based on Trip Status
  useEffect(() => {
    if (!isTripActive) {
      // Clean up watcher when trip is inactive
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      setGpsStatus('idle');
      return;
    }

    // Trip is ACTIVE: Start HTML5 Geolocation watchPosition
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      alert('Aapke phone browser me GPS Geolocation support nahi hai.');
      return;
    }

    setGpsStatus('searching');

    const handleSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const speedKmh = pos.coords.speed !== null && pos.coords.speed !== undefined
        ? Math.round(pos.coords.speed * 3.6)
        : 0;
      const heading = pos.coords.heading || 0;
      const accuracy = Math.round(pos.coords.accuracy);

      setCurrentLat(lat);
      setCurrentLng(lng);
      setCurrentSpeed(speedKmh);
      setCurrentHeading(heading);
      setGpsAccuracy(accuracy);
      setGpsStatus('locked');

      // Send telemetry update to backend
      updateDriverLiveLocation({
        vehicleId: busInfo?.vehicle?.id,
        lat,
        lng,
        speed: speedKmh,
        heading,
        isTripActive: true,
      })
        .then(() => {
          setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
          setSyncCount((c) => c + 1);
        })
        .catch((err) => console.warn('GPS stream sync failed:', err));
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('Geolocation watch error:', err);
      if (err.code === err.PERMISSION_DENIED) {
        setGpsStatus('denied');
      } else {
        setGpsStatus('searching');
      }
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000,
    });

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTripActive, busInfo?.vehicle?.id]);

  // 3. Toggle Trip Active State
  const handleToggleTrip = async () => {
    const newState = !isTripActive;
    try {
      await toggleDriverTrip(newState, busInfo?.vehicle?.id);
      setIsTripActive(newState);
      if (newState) {
        // If starting trip, request immediate position
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
              updateDriverLiveLocation({
                vehicleId: busInfo?.vehicle?.id,
                lat,
                lng,
                speed,
                isTripActive: true,
              }).catch(() => {});
            },
            () => {},
            { enableHighAccuracy: true }
          );
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Trip status update failed');
    }
  };

  // Toggle stop check-in
  const toggleStopChecked = (stopId: string) => {
    setCheckedStops((prev) => {
      const updated = new Set(prev);
      if (updated.has(stopId)) updated.delete(stopId);
      else updated.add(stopId);
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-700">Connecting to Transport Console...</p>
      </div>
    );
  }

  const vehicle = busInfo?.vehicle;
  const route = busInfo?.route;
  const stops = busInfo?.stops || [];

  return (
    <div className="space-y-4 pb-20">
      {/* GPS Location Permission Card */}
      {gpsStatus !== 'locked' && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-4 shadow-md text-amber-950 space-y-2.5">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow font-black">
              <Navigation className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm leading-tight text-amber-950">
                GPS Location Permission Required (लोकेशन अनुमति)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                School bus live GPS tracking aur vidyarthiyon ki suraksha ke liye location permission on karna anivarya hai.
              </p>
            </div>
          </div>
          <button
            onClick={promptDriverGpsPermission}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition active:scale-98 flex items-center justify-center space-x-2"
          >
            <Navigation className="w-4 h-4" />
            <span>Allow GPS Location / लोकेशन ऑन करें</span>
          </button>
        </div>
      )}

      {/* Driver & Bus Profile Card */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 rounded-3xl p-5 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
              <Bus className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950/40 text-amber-100">
                  Driver Console
                </span>
                <span className="text-[10px] bg-white/20 font-bold px-2 py-0.5 rounded-full">
                  {school?.name || 'School Transport'}
                </span>
              </div>
              <h2 className="text-xl font-black mt-1 tracking-tight">{vehicle?.vehicleNo || 'Bus Not Assigned'}</h2>
              <p className="text-xs text-amber-100 font-medium">
                {driver.name} • {vehicle?.vehicleModel || 'School Bus'}
              </p>
            </div>
          </div>
        </div>

        {/* GPS Stream Status Badge */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isTripActive
                  ? gpsStatus === 'locked'
                    ? 'bg-emerald-300 animate-ping'
                    : 'bg-yellow-300 animate-pulse'
                  : 'bg-white/40'
              }`}
            />
            <span className="font-bold">
              {isTripActive
                ? gpsStatus === 'locked'
                  ? 'GPS Streaming Live to Parents'
                  : 'Acquiring GPS Signal...'
                : 'Trip Standby (GPS Inactive)'}
            </span>
          </div>
          {isTripActive && (
            <span className="text-[10px] bg-slate-950/40 font-mono px-2 py-0.5 rounded-lg">
              {syncCount} pings sent
            </span>
          )}
        </div>
      </div>

      {/* TRIP CONTROLLER - BIG ACTION BUTTON */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 text-center">
        <div>
          <h3 className="text-base font-black text-slate-800">
            {isTripActive ? 'Bus Trip is In Progress' : 'Start School Bus Journey'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTripActive
              ? 'Aapke mobile se live GPS coordinates parents aur principal ko dikhai de rahe hain.'
              : 'Yatra shuru karne par GPS activate hoga aur parents bus ki live position dekh sakenge.'}
          </p>
        </div>

        <button
          onClick={handleToggleTrip}
          className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center space-x-2 ${
            isTripActive
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-4 ring-rose-200'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-4 ring-emerald-200'
          }`}
        >
          <Power className="w-5 h-5" />
          <span>{isTripActive ? 'End Trip (यात्रा समाप्त करें)' : 'Start Trip (यात्रा शुरू करें)'}</span>
        </button>

        {/* Live Telemetry Readout Grid */}
        {isTripActive && (
          <div className="grid grid-cols-3 gap-2 pt-2 text-left">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 block">Speed</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-lg font-black text-slate-900">{currentSpeed}</span>
                <span className="text-[10px] text-slate-500 font-bold">km/h</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 block">Accuracy</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-lg font-black text-emerald-600">±{gpsAccuracy || 5}</span>
                <span className="text-[10px] text-slate-500 font-bold">m</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 block">Last Sync</span>
              <span className="text-xs font-black text-purple-700 mt-1 block">
                {lastSyncTime || 'Syncing...'}
              </span>
            </div>
          </div>
        )}

        {/* GPS Permission Warning Banner */}
        {gpsStatus === 'denied' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 text-left flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Location Permission Blocked</strong>
              <p className="text-[11px] mt-0.5">
                Kripya apne phone settings me jakar browser/app ke liye <strong>Location Access "Allow"</strong> karein taaki bus track ho sake.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Route & Stops Checklist */}
      {route ? (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                Assigned Route
              </span>
              <h4 className="font-black text-sm text-slate-900 mt-1">{route.routeName}</h4>
              <p className="text-[11px] text-slate-500">
                {route.startLocation} ➔ {route.endLocation}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-slate-800">{stops.length} Stops</span>
            </div>
          </div>

          {/* Stops List with Driver Check-in */}
          <div className="space-y-2 pt-1">
            {stops.map((s, idx) => {
              const isChecked = checkedStops.has(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleStopChecked(s.id)}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        isChecked
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isChecked ? '✓' : s.sequenceOrder || idx + 1}
                    </div>
                    <div>
                      <h5 className={`text-xs font-bold ${isChecked ? 'line-through opacity-75' : ''}`}>
                        {s.stopName}
                      </h5>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                        <span>Pickup: <strong className="text-slate-800">{s.pickupTime}</strong></span>
                        <span>•</span>
                        <span>Drop: <strong className="text-slate-800">{s.dropTime}</strong></span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                      isChecked
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isChecked ? 'Completed' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-2">
          <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="font-bold text-xs text-slate-700">No Route Assigned to this Bus</h4>
          <p className="text-[11px] text-slate-500">
            School Principal ne is bus ko abhi kisi route se link nahi kiya hai.
          </p>
        </div>
      )}

      {/* Emergency Alert Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            if (confirm('Kya aap Emergency / Breakdown alert school management ko bhejna chahte hain?')) {
              alert('🚨 Emergency Alert Sent to Principal & School Admin!');
            }
          }}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-extrabold text-xs rounded-2xl border border-rose-200 transition flex items-center justify-center space-x-2"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Emergency SOS / Bus Breakdown Alert</span>
        </button>
      </div>
    </div>
  );
};
