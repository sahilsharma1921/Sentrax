import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setNotifications(data);
    };
    fetchNotifs();

    const channel = supabase.channel('notifs-' + user.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + user.id }, (payload) => {
      setNotifications((prev) => [payload.new, ...prev]);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(p => !p)} 
        className="p-2 rounded-xl text-[#596579] hover:text-[#172033] dark:text-gray-400 dark:hover:text-white border border-[#E1E5EE] dark:border-dark-border hover:bg-gray-100 dark:hover:bg-white/5 transition-colors relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 glass-panel border border-[#E1E5EE] dark:border-dark-border rounded-2xl p-4 shadow-2xl z-50">
          <p className="text-xs font-bold text-[#172033] dark:text-white mb-2">Notifications</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-[#596579] dark:text-gray-400">No alerts yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-[#F3F5FA] dark:bg-dark-surface border border-[#E1E5EE] dark:border-dark-border text-xs">
                  <p className="font-bold text-[#172033] dark:text-white">{n.title}</p>
                  <p className="text-[#596579] dark:text-gray-400 text-[11px] mt-0.5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};