import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Clock, MapPin, AlertCircle, FileText } from 'lucide-react';

export const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('crime_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setReports(data);
        setLoading(false);
      });
  }, [user]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'verified': return 'primary';
      case 'resolved': return 'success';
      case 'investigating': return 'info';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#172033] dark:text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-primary" />
          My Submitted Reports
        </h1>
        <p className="text-xs text-[#596579] dark:text-gray-400 mt-1">
          Track investigation status and official law enforcement actions on your filed incidents
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-24 bg-white/60 dark:bg-dark-surface/60" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="text-center p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-[#596579] dark:text-gray-500 mx-auto" />
          <h3 className="text-base font-bold text-[#172033] dark:text-white">No Reports Filed Yet</h3>
          <p className="text-xs text-[#596579] dark:text-gray-400 max-w-sm mx-auto">
            You haven't reported any civic incidents. When you report a crime or safety issue, you can track its progress here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} hoverEffect className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#172033] dark:text-white text-base truncate">
                    {r.title}
                  </h3>
                  <Badge variant={getStatusVariant(r.status)} className="capitalize">
                    {r.status}
                  </Badge>
                </div>
                <p className="text-xs text-[#596579] dark:text-gray-300 line-clamp-2">
                  {r.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#596579] dark:text-gray-400 pt-1">
                  {r.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate max-w-xs">{r.address}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#596579]" />
                    <span>{new Date(r.incident_date || r.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};