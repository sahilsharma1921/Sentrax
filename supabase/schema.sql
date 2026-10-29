-- ==============================================================================
-- SENTRAX: CRIME HEATMAP & EMERGENCY RESPONSE SYSTEM - COMPLETE SCHEMA
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crime_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  severity_weight INTEGER NOT NULL CHECK (severity_weight BETWEEN 1 AND 5),
  icon TEXT DEFAULT 'AlertCircle',
  color TEXT DEFAULT '#EF4444'
);

INSERT INTO public.crime_categories (name, slug, description, severity_weight, icon, color) VALUES
  ('Theft / Larceny', 'theft', 'Petty theft, purse snatching, pickpocketing', 2, 'PackageX', '#F59E0B'),
  ('Physical Assault', 'assault', 'Physical attacks, battery, severe violence', 4, 'Activity', '#EF4444'),
  ('House Burglary', 'burglary', 'Illegal breaking and entering', 3, 'Home', '#F59E0B'),
  ('Vandalism', 'vandalism', 'Property defacement, graffiti, public damage', 1, 'ShieldAlert', '#3B82F6'),
  ('Stalking & Harassment', 'harassment', 'Verbal abuse, stalking, intimidation', 3, 'UserX', '#8B5CF6'),
  ('Armed Robbery', 'robbery', 'Robbery involving lethal weapons', 5, 'AlertOctagon', '#DC2626'),
  ('Online Cybercrime', 'cybercrime', 'Financial scams, phishing, takeovers', 2, 'Cpu', '#06B6D4')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.crime_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.crime_categories(id) ON DELETE RESTRICT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date TIMESTAMPTZ NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'investigating', 'resolved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_evidence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES public.crime_reports(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('police', 'hospital', 'fire')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.emergency_services (name, type, latitude, longitude, phone, address) VALUES
  ('Kakadeo Police Station', 'police', 26.4812, 80.2985, '+91-512-2500112', 'Coaching Hub Road, Kakadeo, Kanpur'),
  ('Swaroop Nagar Police Station', 'police', 26.4764, 80.3150, '+91-512-2540100', 'Near Motijheel Gate, Swaroop Nagar, Kanpur'),
  ('Kotwali Police Station', 'police', 26.4670, 80.3540, '+91-512-2311200', 'Bada Chauraha, Civil Lines, Kanpur'),
  ('Kalyanpur Police Station', 'police', 26.4950, 80.2580, '+91-512-2570112', 'GT Road, Near IIT Gate, Kalyanpur'),
  ('Lala Lajpat Rai Hospital (Hallet)', 'hospital', 26.4770, 80.3190, '+91-512-2535483', 'Medical College, Swaroop Nagar, Kanpur'),
  ('Regency Hospital', 'hospital', 26.4840, 80.3015, '+91-512-3081111', 'A-2, Sarvodaya Nagar, Kanpur'),
  ('Kanpur Central Fire Station', 'fire', 26.4640, 80.3530, '+91-512-2312101', 'Collectorganj, Near Bada Chauraha, Kanpur')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW public.heatmap_points AS
SELECT cr.id, cr.latitude, cr.longitude, cc.severity_weight, cr.incident_date, cr.status, cc.name AS category_name, cc.color AS category_color
FROM public.crime_reports cr
JOIN public.crime_categories cc ON cr.category_id = cc.id
WHERE cr.status IN ('verified', 'investigating', 'resolved');

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crime_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crime_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON public.crime_categories FOR SELECT USING (true);
CREATE POLICY "Public read services" ON public.emergency_services FOR SELECT USING (true);
CREATE POLICY "Read reports" ON public.crime_reports FOR SELECT USING (true);
CREATE POLICY "Insert reports" ON public.crime_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin update reports" ON public.crime_reports FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;