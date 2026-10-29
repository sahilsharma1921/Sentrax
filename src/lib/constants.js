export const ADMIN_SECURITY_KEY = import.meta.env.VITE_ADMIN_INVITE_KEY || 'SENTRAX-ADMIN-KANPUR-2026';

export const CRIME_CATEGORIES = [
  { value: 'Theft', label: 'Theft / Larceny', weight: 2 },
  { value: 'Assault', label: 'Physical Assault', weight: 4 },
  { value: 'Burglary', label: 'House Burglary', weight: 3 },
  { value: 'Vandalism', label: 'Property Vandalism', weight: 1 },
  { value: 'Harassment', label: 'Stalking & Harassment', weight: 3 },
  { value: 'Robbery', label: 'Armed Robbery', weight: 5 },
  { value: 'Cybercrime', label: 'Online Cybercrime', weight: 2 },
  { value: 'Other', label: 'Other Incident', weight: 1 },
];

export const REPORT_STATUSES = {
  pending: { label: 'Pending Review', variant: 'warning' },
  verified: { label: 'Verified', variant: 'primary' },
  investigating: { label: 'Investigating', variant: 'info' },
  resolved: { label: 'Resolved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};