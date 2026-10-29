export const calculateAreaRiskScore = (reports) => {
  if (!reports || reports.length === 0) {
    return { score: 0, level: 'Low', color: '#10B981', count: 0 };
  }
  const now = new Date();
  let cumulativeWeight = 0;

  reports.forEach((r) => {
    const severity = r.severity || r.crime_categories?.severity_weight || 1;
    const incidentDate = new Date(r.incident_date);
    const daysElapsed = Math.max(0, (now - incidentDate) / (1000 * 60 * 60 * 24));
    const recencyFactor = Math.max(0.1, 1.0 - daysElapsed / 60);
    cumulativeWeight += severity * recencyFactor;
  });

  const normalizedScore = Math.min(100, Math.round((cumulativeWeight / 35) * 100));
  let level = 'Low';
  let color = '#10B981';

  if (normalizedScore >= 70) {
    level = 'High';
    color = '#EF4444';
  } else if (normalizedScore >= 40) {
    level = 'Medium';
    color = '#F59E0B';
  }

  return { score: normalizedScore, level, color, count: reports.length };
};

export const groupReportsByGridSector = (reports) => {
  const sectors = {};
  reports.forEach((r) => {
    const sectorKey = `${r.latitude.toFixed(2)},${r.longitude.toFixed(2)}`;
    if (!sectors[sectorKey]) {
      sectors[sectorKey] = {
        lat: parseFloat(r.latitude.toFixed(2)),
        lng: parseFloat(r.longitude.toFixed(2)),
        address: r.address || 'Kanpur Urban Sector',
        reports: [],
      };
    }
    sectors[sectorKey].reports.push(r);
  });
  return Object.values(sectors).map((sector) => ({
    ...sector,
    risk: calculateAreaRiskScore(sector.reports),
  }));
};