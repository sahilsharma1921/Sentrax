import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AlertOctagon, MapPin, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const EmergencySOS = () => {
  const { user } = useAuth();
  const [coords, setCoords] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [sent, setSent] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }));
    }
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      timer.current = setTimeout(() => setCountdown(p => p - 1), 1000);
    } else if (countdown === 0) {
      dispatch();
    }
    return () => clearTimeout(timer.current);
  }, [countdown]);

  const dispatch = async () => {
    await supabase.from('sos_alerts').insert({
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      latitude: coords?.lat || 26.4499,
      longitude: coords?.lng || 80.3319,
      status: 'active',
    });
    setSent(true);
    setCountdown(null);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <Card className="text-center p-8 max-w-sm w-full space-y-6 border-danger/40 shadow-2xl">
        <h2 className="text-2xl font-black text-danger tracking-wider">EMERGENCY DISTRESS BEACON</h2>
        {sent ? (
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-full bg-danger/20 text-danger flex items-center justify-center mx-auto animate-pulse"><AlertOctagon className="w-10 h-10" /></div>
            <p className="font-bold text-gray-900 dark:text-white">Live Beacon Active!</p>
            <p className="text-xs text-gray-500">Authorities dispatched to coordinates.</p>
            <Button variant="outline" size="sm" onClick={() => setSent(false)}>Cancel Beacon</Button>
          </div>
        ) : countdown !== null ? (
          <div className="space-y-4">
            <div className="w-24 h-24 rounded-full bg-danger text-white flex items-center justify-center mx-auto text-4xl font-black font-mono shadow-glow-danger">{countdown}</div>
            <p className="text-xs font-bold text-danger">Transmitting in {countdown}s...</p>
            <Button variant="outline" size="sm" onClick={() => setCountdown(null)} icon={X}>Cancel</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={() => setCountdown(3)} className="w-32 h-32 rounded-full bg-danger text-white font-black text-3xl shadow-glow-danger hover:scale-105 active:scale-95 transition-all">SOS</button>
            <p className="text-xs text-gray-500 dark:text-gray-400">One tap triggers immediate police notification</p>
          </div>
        )}
      </Card>
    </div>
  );
};