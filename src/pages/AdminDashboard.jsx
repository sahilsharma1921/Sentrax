import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Volume2, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { playEmergencyAlarm } from '../lib/soundAlert';
import { useTheme } from '../hooks/useTheme';

export const AdminDashboard = () => {
  const { isDark } = useTheme();
  const [reports, setReports] = useState([]);
  const [sosList, setSosList] = useState([]);

  const loadData = async () => {
    const { data: rep } = await supabase.from('crime_reports').select('*, crime_categories(name)').order('created_at', { ascending: false });
    if (rep) setReports(rep);
    const { data: sos } = await supabase.from('sos_alerts').select('*').eq('status', 'active');
    if (sos) setSosList(sos);
  };

  useEffect(() => {
    loadData();
    const ch = supabase.channel('admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_alerts' }, () => {
        playEmergencyAlarm();
        loadData();
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const updateStatus = async (id, status) => {
    await supabase.from('crime_reports').update({ status }).eq('id', id);
    loadData();
  };

  const chartData = [
    { name: 'Pending', count: reports.filter(r => r.status === 'pending').length },
    { name: 'Verified', count: reports.filter(r => r.status === 'verified').length },
    { name: 'Resolved', count: reports.filter(r => r.status === 'resolved').length },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-3xl font-extrabold text-[#172033] dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" /> Admin Command Center
          </h2>
          <p className="text-xs text-[#596579] dark:text-gray-400 mt-1">Real-time incident dispatch & verification console</p>
        </div>
        <Button variant="outline" size="sm" onClick={playEmergencyAlarm} icon={Volume2}>Test Siren</Button>
      </div>

      {sosList.length > 0 && (
        <div className="p-4 rounded-2xl bg-danger/10 border-2 border-danger text-red-700 dark:text-danger flex justify-between items-center animate-pulse">
          <span className="font-bold text-sm">🚨 ACTIVE DISTRESS SIGNALS: {sosList.length} Citizens Requesting Emergency SOS!</span>
          <Button variant="danger" size="sm" onClick={() => supabase.from('sos_alerts').update({ status: 'resolved' }).eq('status', 'active').then(() => loadData())}>Acknowledge & Resolve</Button>
        </div>
      )}

      {/* Analytics Chart */}
      <Card className="space-y-3">
        <h3 className="font-bold text-sm text-[#172033] dark:text-white uppercase tracking-wider">Reports Verification Pipeline</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={isDark ? '#9CA3AF' : '#596579'} fontSize={12} />
              <YAxis stroke={isDark ? '#9CA3AF' : '#596579'} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#12141C' : '#FFFFFF', 
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E1E5EE', 
                  borderRadius: '12px', 
                  color: isDark ? '#FFFFFF' : '#172033',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }} 
              />
              <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Reports Table */}
      <Card className="space-y-4">
        <h3 className="font-bold text-sm text-[#172033] dark:text-white uppercase tracking-wider">Recent Filings</h3>
        <div className="space-y-2">
          {reports.length === 0 ? (
            <p className="text-xs text-[#596579] dark:text-gray-400 py-4 text-center">No reports filed in database yet.</p>
          ) : (
            reports.map(r => (
              <div key={r.id} className="p-3.5 rounded-xl border border-[#E1E5EE] dark:border-dark-border bg-[#F3F5FA]/60 dark:bg-dark-surface/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="font-bold text-[#172033] dark:text-white text-sm">{r.title}</span>
                  <p className="text-xs text-[#596579] dark:text-gray-400 mt-0.5">{r.address || 'Kanpur Urban'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === 'verified' ? 'primary' : 'warning'}>{r.status}</Badge>
                  {r.status === 'pending' && <Button size="sm" variant="primary" onClick={() => updateStatus(r.id, 'verified')}>Verify</Button>}
                  {r.status === 'verified' && <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'resolved')}>Mark Resolved</Button>}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};