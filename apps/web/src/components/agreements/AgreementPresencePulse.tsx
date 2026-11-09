import { useEffect } from 'react';
import { agreementsAPI } from '../../api/agreements';

export default function AgreementPresencePulse({ agreementId }: { agreementId: string }) {
  useEffect(() => {
    let active = true;
    const ping = () => { void agreementsAPI.markPageOpen(agreementId).catch(() => undefined); };
    ping();
    const timer = window.setInterval(() => { if (active) ping(); }, 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [agreementId]);

  return null;
}
