import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  property: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'completed';
  createdDate: string;
  estimatedDays: number;
}

const maintenanceRequests: MaintenanceRequest[] = [
  {
    id: '1',
    title: 'Air Conditioner repair',
    description: 'Air conditioner is not working, cold air is not coming',
    property: '2 Bed Flat, Gulberg III',
    priority: 'high',
    status: 'open',
    createdDate: '2026-04-14',
    estimatedDays: 2,
  },
  {
    id: '2',
    title: 'Leaking tap in kitchen',
    description: 'Kitchen water tap is leaking',
    property: '2 Bed Flat, Gulberg III',
    priority: 'medium',
    status: 'in-progress',
    createdDate: '2026-04-12',
    estimatedDays: 1,
  },
  {
    id: '3',
    title: 'Ceiling paint damage',
    description: 'Bedroom ceiling paint is peeling off',
    property: '2 Bed Flat, Gulberg III',
    priority: 'low',
    status: 'completed',
    createdDate: '2026-04-10',
    estimatedDays: 3,
  },
];

export default function MaintenanceRequests() {
  const { isDark } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
    setShowForm(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'yellow';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'blue';
      case 'in-progress':
        return 'yellow';
      case 'completed':
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            Maintenance Requests 🛠️
          </h1>
          <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-600'} mt-1`}>Ghar ki repair requests yahan bhejen</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`text-[13px] px-4 py-2 rounded font-semibold transition-all ${
            isDark
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {showForm ? 'Cancel' : 'New Request'}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-[12px] font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Issue Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., AC repair needed"
                className={`w-full px-3 py-2 text-sm rounded border ${
                  isDark
                    ? 'bg-[#1f1f1f] border-white/10 text-white placeholder-[#666]'
                    : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500'
                } focus:outline-none focus:border-green-500`}
                required
              />
            </div>

            <div>
              <label className={`block text-[12px] font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                rows={3}
                className={`w-full px-3 py-2 text-sm rounded border resize-none ${
                  isDark
                    ? 'bg-[#1f1f1f] border-white/10 text-white placeholder-[#666]'
                    : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500'
                } focus:outline-none focus:border-green-500`}
                required
              />
            </div>

            <div>
              <label className={`block text-[12px] font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Priority
              </label>
              <select
                aria-label="Priority level"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                className={`w-full px-3 py-2 text-sm rounded border ${
                  isDark
                    ? 'bg-[#1f1f1f] border-white/10 text-white'
                    : 'bg-gray-50 border-gray-300 text-black'
                } focus:outline-none focus:border-green-500`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              type="submit"
              className={`w-full py-2 rounded font-semibold text-sm ${
                isDark
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } transition-colors`}
            >
              Submit Request
            </button>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {maintenanceRequests.map(req => (
          <Card key={req.id}>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{req.title}</h3>
                    <p className={`text-[12px] ${isDark ? 'text-[#555]' : 'text-gray-600'} mt-0.5`}>
                      {req.property}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Pill variant={getPriorityColor(req.priority)}>
                      {req.priority.toUpperCase()}
                    </Pill>
                    <Pill variant={getStatusBadge(req.status)}>
                      {req.status === 'in-progress' ? 'In Progress' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </Pill>
                  </div>
                </div>

                <p className={`text-[12px] ${isDark ? 'text-[#aaa]' : 'text-gray-600'} mb-3`}>
                  {req.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>
                    Submitted: {req.createdDate} • Est. {req.estimatedDays} days
                  </span>
                  {req.status !== 'completed' && (
                    <button className={`text-[12px] px-3 py-1.5 rounded transition-colors ${
                      isDark
                        ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}>
                      Track Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {maintenanceRequests.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <p className={`text-sm ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>
              Sab kuch theek hai! 🎉
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
