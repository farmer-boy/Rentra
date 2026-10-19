import Card from '../../components/ui/Card';

export default function MaintenanceRequests() {

  return (
    <div>
      <div className="mb-6">
        <h1 className={`text-xl font-extrabold tracking-tight text-text`}>Maintenance Requests</h1>
        <p className={`text-[13px] text-text-muted mt-1`}>View and submit maintenance requests for your rental.</p>
      </div>
      <Card>
        <div className="py-8 text-center">
          <p className={`text-sm text-text-muted`}>Maintenance requests are not available yet.</p>
          <p className="mt-2 text-xs text-gray-500">There is currently no maintenance-request API for submitting or retrieving requests.</p>
        </div>
      </Card>
    </div>
  );
}
