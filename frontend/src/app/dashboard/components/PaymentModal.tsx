'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { markFamilyAsPaid, createPayment, updatePayment, getFamilyPayments } from '@/lib/api';
import { Payment, FamilyWithPayment } from '@/types/family';

interface PaymentModalProps {
  family: FamilyWithPayment;
  schoolYear: string;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function PaymentModal({
  family,
  schoolYear,
  onClose,
  onSuccess,
  showToast,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  
  // Form state
  const [amountDue, setAmountDue] = useState<string>(
    family.payment_status?.amount_due?.toString() || ''
  );
  const [amountPaid, setAmountPaid] = useState<string>(
    family.payment_status?.amount_due?.toString() || 
    family.payment_status?.amount_paid?.toString() || 
    ''
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  
  const loadPaymentHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getFamilyPayments(family.id);
      setPaymentHistory(history);
      
      // If there's an existing payment for this school year, populate the form
      const currentPayment = history.find(p => p.school_year === schoolYear);
      if (currentPayment) {
        if (currentPayment.amount_due) setAmountDue(currentPayment.amount_due.toString());
        if (currentPayment.amount_paid) setAmountPaid(currentPayment.amount_paid.toString());
        if (currentPayment.payment_method) setPaymentMethod(currentPayment.payment_method);
        if (currentPayment.notes) setNotes(currentPayment.notes);
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [family.id, schoolYear]);

  useEffect(() => {
    loadPaymentHistory();
  }, [loadPaymentHistory]);

  const handleMarkAsPaid = async () => {
    setIsLoading(true);
    try {
      await markFamilyAsPaid(
        family.id,
        schoolYear,
        amountPaid ? parseFloat(amountPaid) : undefined,
        paymentMethod,
        notes || undefined
      );
      showToast(`${family.family_name} marked as paid`, 'success');
      onSuccess();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      showToast('Failed to record payment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPartialPayment = async () => {
    if (!amountPaid) {
      showToast('Please enter amount paid', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const existingPayment = paymentHistory.find(p => p.school_year === schoolYear);
      
      if (existingPayment) {
        // Update existing payment
        await updatePayment(existingPayment.id, {
          amount_due: amountDue ? parseFloat(amountDue) : null,
          amount_paid: parseFloat(amountPaid),
          payment_method: paymentMethod,
          payment_date: paymentDate,
          notes: notes || null,
        });
      } else {
        // Create new payment
        await createPayment({
          family_id: family.id,
          school_year: schoolYear,
          amount_due: amountDue ? parseFloat(amountDue) : null,
          amount_paid: parseFloat(amountPaid),
          payment_method: paymentMethod,
          payment_date: paymentDate,
          notes: notes || null,
        });
      }
      
      showToast('Payment recorded successfully', 'success');
      onSuccess();
    } catch (error) {
      console.error('Failed to record payment:', error);
      showToast('Failed to record payment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Paid</span>;
      case 'partial':
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Partial</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Unpaid</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
              <p className="text-sm text-gray-500">{family.family_name} • {schoolYear}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Current Status */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Status:</span>
              {getStatusBadge(family.payment_status?.payment_status || 'unpaid')}
            </div>
            {family.payment_status?.amount_paid && family.payment_status.amount_paid > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Paid: ${family.payment_status.amount_paid}
                {family.payment_status.amount_due && (
                  <> of ${family.payment_status.amount_due}</>
                )}
              </p>
            )}
          </div>
          
          {/* Form */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount Due
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amountDue}
                  onChange={(e) => setAmountDue(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount Paid
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-700"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="zelle">Zelle</option>
                  <option value="venmo">Venmo</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>
          </div>
          
          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="px-6 pb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Payment History</h3>
              <div className="max-h-32 overflow-y-auto border rounded-lg">
                {isLoadingHistory ? (
                  <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-600">Year</th>
                        <th className="px-3 py-2 text-left text-gray-600">Status</th>
                        <th className="px-3 py-2 text-right text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-3 py-2">{payment.school_year}</td>
                          <td className="px-3 py-2">{getStatusBadge(payment.payment_status)}</td>
                          <td className="px-3 py-2 text-right">${payment.amount_paid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
            <button
              onClick={handleRecordPartialPayment}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
            >
              Record Payment
            </button>
            <button
              onClick={handleMarkAsPaid}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Processing...' : 'Mark as Paid'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
