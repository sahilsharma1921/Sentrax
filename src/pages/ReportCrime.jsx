import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, Search, Crosshair, FileText, CheckCircle2, ShieldAlert, Loader2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

// Custom Marker Pin
const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Map Controller for Smooth Fly-to
const MapFlyTo = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 1.2 });
  }, [center, map]);
  return null;
};

// Map Click Listener
const MapClickSelector = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const ReportCrime = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form States
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  
  // Location States (Auto-handled)
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ lat: 26.4764, lng: 80.3150 }); // Default: Swaroop Nagar, Kanpur
  
  // Loaders & Errors
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch categories from Supabase
  useEffect(() => {
    supabase.from('crime_categories').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setCategories(data);
        setCategoryId(data[0].id);
      }
    });
  }, []);

  // 2. Reverse Geocode (Lat/Lng -> Readable Address)
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`Near ${lat.toFixed(4)}, ${lng.toFixed(4)}, Kanpur`);
      }
    } catch {
      setAddress(`Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
  };

  // 3. Forward Geocode (Search text address -> Lat/Lng)
  const handleSearchAddress = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    try {
      // Append Kanpur for localized accuracy
      const query = searchQuery.toLowerCase().includes('kanpur') ? searchQuery : `${searchQuery}, Kanpur`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setCoords({ lat: newLat, lng: newLng });
        setAddress(data[0].display_name);
      } else {
        setErrorMsg(`Could not find "${searchQuery}". Please click on the map directly.`);
      }
    } catch (err) {
      setErrorMsg('Address lookup failed. You can click on the map to set location.');
    } finally {
      setIsSearching(false);
    }
  };

  // 4. Use My Current GPS Location Button
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setCoords({ lat: newLat, lng: newLng });
        reverseGeocode(newLat, newLng);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setErrorMsg(`GPS permission denied: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 5. When user clicks anywhere on map
  const handleMapClick = (lat, lng) => {
    setCoords({ lat, lng });
    reverseGeocode(lat, lng);
  };

  // 6. Submit Incident
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      
      const { error } = await supabase.from('crime_reports').insert({
        user_id: user?.id,
        category_id: categoryId,
        title,
        description: desc,
        address: address || searchQuery || 'Kanpur Metropolitan Area',
        latitude: coords.lat,
        longitude: coords.lng,
        severity: selectedCat?.severity_weight || 2,
        status: 'pending',
        incident_date: new Date().toISOString(),
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-900 dark:text-white">
          Report an Incident
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Type an area name or click on the map to mark where the incident took place.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card className="shadow-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Incident Title */}
          <Input
            id="title"
            label="Incident Title"
            placeholder="e.g. Phone snatching near Coaching Crossing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Crime Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Crime Category <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    categoryId === cat.id
                      ? 'border-primary bg-primary text-white shadow-glow'
                      : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 hover:border-primary'
                  }`}
                >
                  <p className="truncate">{cat.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Incident Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe what happened, suspect appearance, vehicle details..."
              className="w-full bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          {/* ======================================================== */}
          {/* SMART ADDRESS PICKER (NO MANUAL LAT/LNG)                 */}
          {/* ======================================================== */}
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-dark-border">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Incident Location <span className="text-danger">*</span>
              </label>

              {/* 1-Click GPS Button */}
              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                <span>Use My Current Location</span>
              </button>
            </div>

            {/* Address Search Box */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Type landmark or area (e.g. Kakadeo, Kanpur, Motijheel)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchAddress(); } }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSearchAddress}
                isLoading={isSearching}
                icon={Search}
              >
                Search
              </Button>
            </div>

            {/* Interactive Location Map */}
            <div className="relative h-56 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-border shadow-inner">
              <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={14}
                scrollWheelZoom={false}
                className="h-full w-full z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapFlyTo center={[coords.lat, coords.lng]} />
                <MapClickSelector onSelect={handleMapClick} />
                <Marker position={[coords.lat, coords.lng]} icon={pinIcon} />
              </MapContainer>

              <div className="absolute bottom-2 left-2 z-20 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center gap-1 pointer-events-none">
                <MapPin className="w-3 h-3 text-danger" />
                <span>Tip: Click on map to place pin accurately</span>
              </div>
            </div>

            {/* Auto-Resolved Address Card */}
            {address && (
              <div className="p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-900 dark:text-white">Selected Location:</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4"
            isLoading={isSubmitting}
            icon={FileText}
          >
            Submit Incident Report
          </Button>
        </form>
      </Card>
    </div>
  );
};