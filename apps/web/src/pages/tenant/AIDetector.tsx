import Card from '../../components/ui/Card';

export default function AIDetector() {
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 text-text`}>Listing Safety Information</h2>
        <p className={`text-[13px] text-text-muted`}>Live detector results and listing-risk analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <div className={`text-[13px] font-bold mb-4 text-text`}>Flagged Listings</div>
          <p className={`py-6 text-center text-[12px] text-text-muted`}>
            No live flagged-listing data is available. The backend does not provide a detector queue for this screen.
          </p>
        </Card>
        <Card>
          <div className={`text-[13px] font-bold mb-4 text-text`}>Detection Results</div>
          <p className={`py-6 text-center text-[12px] text-text-muted`}>
            No detector API is available for authenticity checks, fraud probabilities, or risk signals.
          </p>
        </Card>
      </div>
    </div>
  );
}
