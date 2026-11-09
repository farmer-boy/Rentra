export default function AgreementDisputeEligibilityStatus({ counts }: { counts?: { tenant: number; landlord: number; eligible: boolean } }) {
  if (!counts || counts.eligible || (counts.tenant === 0 && counts.landlord === 0)) return null;
  return <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
    Dispute unlocks after both sides have 3 rejections. Current count: tenant {Math.min(counts.tenant, 3)}/3 · landlord {Math.min(counts.landlord, 3)}/3.
  </p>;
}
