import Card from '../../components/ui/Card';
import { Bot } from 'lucide-react';

const AdminFakeDetectorQueue = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fake Detector Queue</h1>
      <p className="text-gray-600 dark:text-gray-400">Review AI-flagged listings for potential fraud</p>
    </div>

    <Card className="p-8">
      <div className="flex flex-col items-center text-center gap-3">
        <Bot size={32} className="text-gray-400" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Live detector data is unavailable</h2>
        <p className="max-w-xl text-sm text-gray-600 dark:text-gray-400">
          The backend does not currently provide a fake-listing detector queue. No detector reports or scores can be shown here.
        </p>
      </div>
    </Card>
  </div>
);

export default AdminFakeDetectorQueue;
