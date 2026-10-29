import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Flame, Search, ShieldCheck, AlertTriangle, ShieldAlert, Sliders, Eye, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

// Heatmap Layer
const HeatmapLayer = ({ points, radius = 35 }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    const heatData = points.map((p) => [
      p.latitude,
      p.longitude,
      Math.min(Math.max(((p.severity || 3) / 5) * 1.2, 0.4), 1.0),
    ]);
    const heatLayer = L.heatLayer(heatData, {
      radius: radius,
      blur: 22,
      maxZoom: 16,
      max: 1.0,
      minOpacity: 0.5,
      gradient: { 0.2: '#3B82F6', 0.4: '#10B981', 0.6: '#F59E0B', 0.8: '#F97316', 1.0: '#EF4444' },
    });
    heatLayer.addTo(map);
    return () => { map.removeLayer(heatLayer); };
  }, [map, points, radius]);
  return null;
};

// Map Fly-To Helper
const MapFlyTo = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.2 });
  }, [center, map]);
  return null;
};

export const HeatmapView = () => {
  const [points, setPoints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showMarkers, setShowMarkers] = useState(false);
  const [mapCenter, setMapCenter] = useState([26.4670, 80.3250]); // Kanpur center

  // ZONE SAFETY CHECKER STATE
  const [zoneQuery, setZoneQuery] = useState('');
  const [zoneResult, setZoneResult] = useState(null);

  useEffect(() => {
    supabase.from('crime_categories').select('*').then(({ data }) => { if (data) setCategories(data); });
  }, []);

  const fetchPoints = async () => {
    try {
      let query = supabase.from('crime_reports').select('id, title, latitude, longitude, severity, incident_date, status, address, crime_categories(name)');
      if (selectedCategory !== 'all') query = query.eq('crime_categories.name', selectedCategory);
      const { data } = await query;
      if (data) setPoints(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPoints(); }, [selectedCategory, dateRange]);

  // ZONE SAFETY CALCULATOR (Safe / Moderate / Danger)
  const handleCheckAreaZone = (e) => {
    if (e) e.preventDefault();
    if (!zoneQuery.trim()) return;

    const matchedReports = points.filter((p) =>
      p.address?.toLowerCase().includes(zoneQuery.toLowerCase()) ||
      p.title?.toLowerCase().includes(zoneQuery.toLowerCase())
    );

    const count = matchedReports.length;
    let zone = 'SAFER ZONE';
    let variant = 'success';
    let icon = ShieldCheck;
    let score = 25;
    let advice = 'Low crime activity detected. Standard caution recommended.';

    if (count >= 12) {
      zone = 'DANGER ZONE';
      variant = 'danger';
      icon = ShieldAlert;
      score = 85;
      advice = 'High cluster of critical incidents (Robbery / Assault). Avoid travelling alone late at night.';
    } else if (count >= 5) {
      zone = 'MODERATE ZONE';
      variant = 'warning';
      icon = AlertTriangle;
      score = 55;
      advice = 'Moderate incidents reported (Theft / Burglary). Keep valuables secure.';
    }

    if (matchedReports.length > 0) {
      setMapCenter([matchedReports[0].latitude, matchedReports[0].longitude]);
    }

    setZoneResult({
      area: zoneQuery,
      count,
      zone,
      variant,
      icon,
      score,
      advice,
    });
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-4.5rem)] w-full overflow-hidden flex flex-col">
      {/* Top Left: Controls & Zone Analyzer */}
      <div className="absolute top-4 left-4 z-20 w-80 sm:w-96 glass-panel p-4 rounded-2xl shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">Live Crime Heatmap</h2>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            {points.length} Incidents
          </span>
        </div>

        {/* ======================================================== */}
        {/* AREA ZONE CHECKER (SAFE / MODERATE / DANGER)             */}
        {/* ======================================================== */}
        <div className="pt-2 border-t border-gray-200 dark:border-dark-border space-y-2">
          <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-gray-400 block">
            Check Any Area Safety Zone
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Type area (e.g. Kakadeo, Swaroop Nagar, Barra)..."
              value={zoneQuery}
              onChange={(e) => setZoneQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCheckAreaZone(e); }}
              className="flex-1 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-xl px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
            />
            <Button size="sm" variant="primary" onClick={handleCheckAreaZone} icon={Search}>
              Check
            </Button>
          </div>
        </div>

        {/* Zone Result Card */}
        {zoneResult && (
          <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
            zoneResult.variant === 'danger'
              ? 'bg-danger/10 border-danger text-danger'
              : zoneResult.variant === 'warning'
              ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-extrabold uppercase text-[11px] flex items-center gap-1">
                <zoneResult.icon className="w-4 h-4" /> {zoneResult.zone}
              </span>
              <span className="font-mono font-bold text-[10px]">Risk: {zoneResult.score}/100</span>
            </div>
            <p className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">
              Area: {zoneResult.area} ({zoneResult.count} active reports)
            </p>
            <p className="text-[10px] leading-tight text-gray-600 dark:text-gray-300">
              {zoneResult.advice}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100 dark:border-dark-border">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Crime Type</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-xl p-1.5 text-xs text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Pins Toggle</label>
            <button
              onClick={() => setShowMarkers((p) => !p)}
              className="w-full py-1.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showMarkers ? 'Hide Pins' : 'Show Pins'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full z-10">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFlyTo center={mapCenter} />
        <HeatmapLayer points={points} radius={38} />

        {showMarkers &&
          points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={6}
              pathOptions={{
                fillColor: (p.severity || 1) >= 4 ? '#EF4444' : '#F59E0B',
                fillOpacity: 0.9,
                color: '#ffffff',
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-gray-900">{p.title}</p>
                  <p className="text-gray-600">{p.address}</p>
                  <p className="font-mono text-primary font-bold">Severity: {p.severity || 1}/5</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
};