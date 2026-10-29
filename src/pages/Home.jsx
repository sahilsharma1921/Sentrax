import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { 
  ShieldCheck, Flame, ArrowRight, FileText, CheckCircle2, 
  AlertOctagon, CheckSquare, RefreshCw, MapPin, Clock, 
  ShieldAlert, Info, Layers, ExternalLink, Radio, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const Home = () => {
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    activeSos: 0,
    resolved: 0,
    pending: 0,
    investigating: 0,
  });
  const [incidents, setIncidents] = useState([]);
  const [coverageAreas, setCoverageAreas] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real-time verified data from Supabase
  const loadHomeData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    setErrorMsg('');

    try {
      // 1. Fetch authorized incident data for stats and map preview (PII excluded)
      const { data: reportsData, error: reportsErr } = await supabase
        .from('crime_reports')
        .select('id, title, status, severity, incident_date, latitude, longitude, address, category_id, crime_categories(name, color)')
        .order('incident_date', { ascending: false });

      if (reportsErr) throw reportsErr;

      // 2. Fetch active SOS alerts
      const { data: sosData, error: sosErr } = await supabase
        .from('sos_alerts')
        .select('id, status')
        .eq('status', 'active');

      if (sosErr) throw sosErr;

      const totalCount = reportsData?.length || 0;
      const verifiedCount = reportsData?.filter(r => r.status === 'verified').length || 0;
      const resolvedCount = reportsData?.filter(r => r.status === 'resolved').length || 0;
      const pendingCount = reportsData?.filter(r => r.status === 'pending').length || 0;
      const investigatingCount = reportsData?.filter(r => r.status === 'investigating').length || 0;
      const activeSosCount = sosData?.length || 0;

      // Filter valid coordinates for Kanpur region map preview
      const validPoints = (reportsData || []).filter(
        r => r.latitude && r.longitude && !isNaN(r.latitude) && !isNaN(r.longitude)
      );

      // Extract unique regional coverage areas from addresses
      const areaSet = new Set();
      validPoints.forEach(r => {
        if (r.address) {
          const locality = r.address.split(',')[0].trim();
          if (locality && locality.length < 35) areaSet.add(locality);
        }
      });

      setStats({
        total: totalCount,
        verified: verifiedCount,
        resolved: resolvedCount,
        pending: pendingCount,
        investigating: investigatingCount,
        activeSos: activeSosCount,
      });

      setIncidents(validPoints);
      setCoverageAreas(Array.from(areaSet).slice(0, 6));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Home data load error:', err);
      setErrorMsg('Could not sync live stats. Retrying automatically.');
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  // Initial load and Supabase Realtime subscriptions
  useEffect(() => {
    loadHomeData();

    // Subscribe to live incident reports and SOS state transitions
    const channel = supabase
      .channel('home-realtime-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crime_reports' }, () => {
        loadHomeData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, () => {
        loadHomeData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadHomeData]);

  // Marker Color Palette based on Severity
  const getMarkerColor = (severity) => {
    if (severity >= 4) return { fill: '#EF4444', border: '#B91C1C', label: 'High' };
    if (severity >= 2) return { fill: '#F59E0B', border: '#B45309', label: 'Moderate' };
    return { fill: '#3B82F6', border: '#1D4ED8', label: 'Minor' };
  };

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-12">
      {/* 1. HERO SECTION */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <Badge variant="primary" className="text-xs px-3 py-1 font-bold">
          SENTRAX • CIVIC SAFETY PLATFORM
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#172033] dark:text-white leading-tight">
          Crime Heatmap & <span className="text-primary">Emergency Response</span>
        </h1>
        <p className="text-base sm:text-lg text-[#596579] dark:text-gray-400 leading-relaxed">
          Crowdsourced incident intelligence, real-time spatial heatmaps, and one-tap emergency SOS dispatch for Kanpur Metro.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
          <Link to="/report">
            <Button variant="primary" size="lg" icon={ArrowRight}>
              Report Incident
            </Button>
          </Link>
          <Link to="/heatmap">
            <Button variant="outline" size="lg" icon={Flame}>
              Live Heatmap
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. FOUR LIVE STATISTICS CARDS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono tracking-wider text-[#596579] dark:text-gray-400 uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Live Operational Metrics
          </h2>
          <button
            onClick={() => loadHomeData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-[#596579] dark:text-gray-400 hover:text-primary transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (isRefreshing ? 'animate-spin text-primary' : '')} />
            <span className="hidden sm:inline">Sync Now</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Reports */}
          <Card hoverEffect className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#596579] dark:text-gray-400 uppercase tracking-wider">
                Total Reports
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-primary/20 border border-indigo-200 dark:border-primary/30 flex items-center justify-center text-primary">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-20 bg-gray-200 dark:bg-dark-surface rounded-lg animate-pulse" />
            ) : (
              <div className="text-3xl font-black font-mono text-[#172033] dark:text-white">
                {stats.total}
              </div>
            )}
            <p className="text-[11px] text-[#596579] dark:text-gray-400">
              Submitted citizen & FIR incident logs
            </p>
          </Card>

          {/* Card 2: Verified Incidents */}
          <Card hoverEffect className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#596579] dark:text-gray-400 uppercase tracking-wider">
                Verified Incidents
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-20 bg-gray-200 dark:bg-dark-surface rounded-lg animate-pulse" />
            ) : (
              <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {stats.verified}
              </div>
            )}
            <p className="text-[11px] text-[#596579] dark:text-gray-400">
              Validated by authorized admin review
            </p>
          </Card>

          {/* Card 3: Active SOS Alerts */}
          <Card hoverEffect className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#596579] dark:text-gray-400 uppercase tracking-wider">
                Active SOS Alerts
              </span>
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-danger/20 border border-red-200 dark:border-danger/30 flex items-center justify-center text-danger relative">
                {stats.activeSos > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-danger opacity-40"></span>
                )}
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-20 bg-gray-200 dark:bg-dark-surface rounded-lg animate-pulse" />
            ) : (
              <div className="text-3xl font-black font-mono text-danger">
                {stats.activeSos}
              </div>
            )}
            <p className="text-[11px] text-[#596579] dark:text-gray-400">
              {stats.activeSos > 0 ? 'Live distress beacons broadcasting' : 'Zero active emergency distress signals'}
            </p>
          </Card>

          {/* Card 4: Resolved Cases */}
          <Card hoverEffect className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#596579] dark:text-gray-400 uppercase tracking-wider">
                Resolved Cases
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-20 bg-gray-200 dark:bg-dark-surface rounded-lg animate-pulse" />
            ) : (
              <div className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
                {stats.resolved}
              </div>
            )}
            <p className="text-[11px] text-[#596579] dark:text-gray-400">
              Investigation complete and closed
            </p>
          </Card>
        </div>
      </section>

      {/* 3. LIVE CRIME MAP PREVIEW (KANPUR METROPOLITAN) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] dark:text-white">
                Kanpur Incident Map Preview
              </h2>
            </div>
            <p className="text-xs text-[#596579] dark:text-gray-400 mt-1">
              Geospatial plot of verified and reported occurrences across Kanpur urban sectors
            </p>
          </div>
          <Link to="/heatmap">
            <Button variant="primary" size="sm" icon={Flame}>
              View Full Heatmap
            </Button>
          </Link>
        </div>

        <Card className="p-2 sm:p-3 relative shadow-panel">
          <div className="relative h-80 sm:h-96 w-full rounded-xl overflow-hidden border border-[#E1E5EE] dark:border-dark-border">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-dark-surface">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs text-[#596579] dark:text-gray-400">Rendering Kanpur coordinates...</p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={[26.4670, 80.3250]}
                zoom={12}
                scrollWheelZoom={false}
                className="h-full w-full z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {incidents.map((incident) => {
                  const markerStyle = getMarkerColor(incident.severity || 1);
                  return (
                    <CircleMarker
                      key={incident.id}
                      center={[incident.latitude, incident.longitude]}
                      radius={incident.severity >= 4 ? 7 : 5}
                      pathOptions={{
                        fillColor: markerStyle.fill,
                        fillOpacity: 0.85,
                        color: '#FFFFFF',
                        weight: 1.5,
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1.5 p-1 min-w-[180px]">
                          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1">
                            <span className="font-bold text-gray-900 truncate">
                              {incident.title}
                            </span>
                            <span className={'px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ' + (
                              incident.status === 'verified' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : incident.status === 'resolved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            )}>
                              {incident.status}
                            </span>
                          </div>

                          <p className="text-gray-600 text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="truncate">{incident.address || 'Kanpur Area'}</span>
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                            <span>Severity: {incident.severity || 1}/5</span>
                            <span>{new Date(incident.incident_date).toLocaleDateString()}</span>
                          </div>

                          <p className="text-[9px] text-gray-400 italic pt-1 border-t border-gray-100">
                            🛡️ Citizen identity withheld for privacy protection
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            )}

            {/* Overlaid Legend Box */}
            <div className="absolute top-3 right-3 z-20 glass-panel p-2.5 rounded-xl shadow-md border border-[#E1E5EE] dark:border-dark-border text-[11px] space-y-1.5 pointer-events-none sm:pointer-events-auto">
              <span className="font-bold text-[#172033] dark:text-white block text-[10px] uppercase font-mono">
                Severity Clusters
              </span>
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-danger"></span>
                <span>High (Score 4-5)</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Moderate (Score 2-3)</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Low / Minor</span>
              </div>
            </div>

            {/* Overlaid Incident Counter */}
            <div className="absolute bottom-3 left-3 z-20 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{incidents.length} Mapped Incidents</span>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. TRUST & TRANSPARENCY INDICATORS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] dark:text-white">
            Trust & Transparency Indicators
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Indicator 1: Refresh & Last Updated Timestamp */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#596579] dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" /> Last Updated
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sync
              </span>
            </div>
            <div className="text-base font-bold font-mono text-[#172033] dark:text-white">
              {lastUpdated 
                ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Synchronizing...'}
            </div>
            <p className="text-xs text-[#596579] dark:text-gray-400">
              Data actively recomputed from Supabase PostgreSQL replication events.
            </p>
          </Card>

          {/* Indicator 2: Report Verification Breakdown */}
          <Card className="p-5 space-y-3">
            <span className="text-xs font-bold text-[#596579] dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verification Status
            </span>
            <div className="space-y-2">
              {/* Multi-segment progress bar */}
              <div className="h-2.5 w-full bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden flex border border-[#E1E5EE] dark:border-dark-border">
                <div 
                  style={{ width: (stats.total > 0 ? (stats.verified / stats.total) * 100 : 0) + '%' }} 
                  className="bg-emerald-500 h-full" 
                  title={'Verified: ' + stats.verified}
                />
                <div 
                  style={{ width: (stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0) + '%' }} 
                  className="bg-blue-500 h-full" 
                  title={'Resolved: ' + stats.resolved}
                />
                <div 
                  style={{ width: (stats.total > 0 ? (stats.pending / stats.total) * 100 : 0) + '%' }} 
                  className="bg-amber-500 h-full" 
                  title={'Pending: ' + stats.pending}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-[#596579] dark:text-gray-400 pt-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.verified} Verified</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{stats.resolved} Resolved</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{stats.pending} Pending</span>
              </div>
            </div>
            <p className="text-xs text-[#596579] dark:text-gray-400">
              Only reports verified by police/admin are converted into active density scores.
            </p>
          </Card>

          {/* Indicator 3: Data Coverage & Safety Disclaimer */}
          <Card className="p-5 space-y-3">
            <span className="text-xs font-bold text-[#596579] dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" /> Active Coverage Nodes
            </span>
            <div className="flex flex-wrap gap-1.5">
              {coverageAreas.length > 0 ? (
                coverageAreas.map((area, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F3F5FA] dark:bg-dark-surface border border-[#E1E5EE] dark:border-dark-border text-[#172033] dark:text-gray-300"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-gray-400">Kanpur Metro Grid</span>
              )}
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 leading-tight flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Zero-report zones indicate lack of submitted reports, not guaranteed safety. Always practice standard vigilance.
              </span>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};