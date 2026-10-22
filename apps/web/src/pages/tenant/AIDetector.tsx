import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { reportsAPI, type UserReport } from '../../api/reports';

export default function AIDetector() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    reportsAPI.confirmedFakeListingReports()
      .then((records) => { if (active) setReports(records); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 text-text`}>Confirmed Fake Listing Reports</h2>
        <p className={`text-[13px] text-text-muted`}>Reports you submitted that an admin confirmed as fake listings</p>
      </div>

      <Card className="mb-4">
        <p className="text-sm text-text-muted">Automated AI scans are not available yet. This page shows only fake-listing reports confirmed by an admin.</p>
      </Card>
      <Card>
        <div className={`text-[13px] font-bold mb-4 text-text`}>Admin-confirmed reports ({reports.length})</div>
        {loading ? (
          <p className="py-6 text-center text-[12px] text-text-muted">Loading confirmed reports…</p>
        ) : error ? (
          <p role="alert" className="py-6 text-center text-[12px] text-red-600">Confirmed reports could not be loaded.</p>
        ) : reports.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-text-muted">No admin-confirmed fake-listing reports from your account.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text">Fake listing confirmed</span>
                  <span className="text-xs text-text-muted">{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-xs text-text-muted">Listing ID: {report.targetId}</p>
                {report.description && <p className="mt-2 text-sm text-text-muted">{report.description}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
