import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Phone, Navigation, Shield, HeartPulse, Flame, Crosshair } from 'lucide-react';
import { Button } from '../components/ui/Button';

const calculateKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const NearbyServices = () => {
  const [services, setServices] = useState([]);
  const [userLoc, setUserLoc] = useState({ lat: 26.4499, lng: 80.3319 });
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }));
    }
    supabase.from('emergency_services').select('*').then(({ data }) => {
      if (data) setServices(data);
    });
  }, []);

  const sorted = services
    .map(s => ({ ...s, dist: calculateKm(userLoc.lat, userLoc.lng, s.latitude, s.longitude) }))
    .filter(s => filterType === 'all' || s.type === filterType)
    .sort((a, b) => a.dist - b.dist);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Emergency Services Locator</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Proximity-sorted police, hospitals, and fire departments</p>
        </div>
        <div className="flex gap-2">
          {['all', 'police', 'hospital', 'fire'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filterType === t ? 'bg-primary text-white shadow-glow' : 'glass-panel text-gray-600 dark:text-gray-400'
            }`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map(s => (
          <Card key={s.id} hoverEffect className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{s.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.address}</p>
              </div>
              <Badge variant="primary" className="font-mono">{s.dist.toFixed(1)} km</Badge>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
              <a href={`tel:${s.phone}`} className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-glow hover:bg-primary-hover"><Phone className="w-3.5 h-3.5" /> Call {s.phone}</a>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl glass-panel text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center gap-1 hover:border-primary"><Navigation className="w-3.5 h-3.5 text-primary" /> Directions</a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};