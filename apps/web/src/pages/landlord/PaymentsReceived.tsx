import { useState } from 'react';
import { Check, Clock, AlertCircle, Home } from 'lucide-react';
import Card from '../../components/ui/Card';

interface Payment {
  id: string;
  tenantName: string;
  property: string;
  amount: number;
  dueDate: string;
  receivedDate: string | null;
  status: 'paid' | 'pending' | 'late';
  method: string;
}

const PaymentsReceived = () => {
  const [payments] = useState<Payment[]>([
    {
      id: '1',
      tenantName: 'John Smith',
      property: 'Modern 2BR Apartment Downtown',
      amount: 2500,
      dueDate: '2024-04-01',
      receivedDate: '2024-04-01',
      status: 'paid',
      method: 'Bank Transfer',
    },
    {
      id: '2',
      tenantName: 'Sarah Johnson',
      property: 'Spacious 3BR House with Backyard',
      amount: 3200,
      dueDate: '2024-04-01',
      receivedDate: '2024-04-02',
      status: 'paid',
      method: 'Bank Transfer',
    },
    {
      id: '3',
      tenantName: 'Michael Brown',
      property: 'Spacious 3BR House with Backyard',
      amount: 3200,
      dueDate: '2024-04-01',
      receivedDate: null,
      status: 'late',
      method: 'Pending',
    },
    {
      id: '4',
      tenantName: 'Emily Davis',
      property: 'Modern 2BR Apartment Downtown',
      amount: 2500,
      dueDate: '2024-05-01',
      receivedDate: null,
      status: 'pending',
      method: 'Pending',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'late':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const totalExpected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalReceived = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments
    .filter(p => p.status === 'late')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payments Received</h1>
        <p className="text-gray-600 dark:text-gray-300">Track rent payments from your tenants</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Expected</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${totalExpected.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center bg-green-50 dark:bg-green-900/20">
          <p className="text-green-700 dark:text-green-300 text-sm">Total Received</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">${totalReceived.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center bg-red-50 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-300 text-sm">Overdue</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">${totalOverdue.toLocaleString()}</p>
        </Card>
      </div>

      {/* Payment List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Payment Details</h3>
        {payments.map((payment) => (
          <Card key={payment.id} className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{payment.tenantName}</h4>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Home size={14} className="mr-2" />
                      {payment.property}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Due Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(payment.dueDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Amount</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">${payment.amount.toLocaleString()}</p>
                </div>

                <div className="">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    {payment.status === 'paid' ? 'Paid' : payment.status === 'pending' ? 'Pending' : 'Late'}
                  </div>
                  {payment.receivedDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Received {new Date(payment.receivedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="text-right min-w-24">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Method</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{payment.method}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PaymentsReceived;
