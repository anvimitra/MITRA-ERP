import React, { useState } from 'react';
import { FeeItem, Student } from '../types';
import { MOCK_FEES } from '../api';
import { CreditCard, CheckCircle2, AlertCircle, Receipt, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  student: Student;
}

export const FeesView: React.FC<Props> = ({ student }) => {
  const [fees, setFees] = useState<FeeItem[]>(MOCK_FEES);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<FeeItem | null>(null);

  const totalDue = fees
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + f.amount, 0);

  const handlePay = (id: string) => {
    setPayingId(id);
    setTimeout(() => {
      setFees((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'paid',
                receiptNo: `LSK-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
                paymentDate: new Date().toISOString().split('T')[0],
              }
            : f
        )
      );
      setPayingId(null);
    }, 1200);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Due Banner */}
      <div className="bg-gradient-to-br from-purple-800 via-indigo-900 to-purple-950 rounded-2xl p-4 text-white shadow-md">
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-purple-950">
          Fee & Accounts Desk
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <p className="text-xs text-purple-200">Total Outstanding Balance</p>
            <h2 className="text-2xl font-black text-white">₹{totalDue.toLocaleString()}</h2>
          </div>
          {totalDue === 0 ? (
            <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>All Dues Cleared</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-300 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>Payment Pending</span>
            </span>
          )}
        </div>
      </div>

      {/* Fee Items List */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Fee Invoices & Dues</h3>

        <div className="space-y-3">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className={`p-3.5 rounded-xl border transition ${
                fee.status === 'paid' ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/50 border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{fee.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {fee.status === 'paid' ? (
                      <span className="text-emerald-700 font-semibold">
                        Paid on {fee.paymentDate} • {fee.receiptNo}
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold">Due by {fee.dueDate}</span>
                    )}
                  </p>
                </div>
                <span className="font-black text-sm text-slate-900">₹{fee.amount.toLocaleString()}</span>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                {fee.status === 'paid' ? (
                  <button
                    onClick={() => setReceiptModal(fee)}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Official Receipt</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePay(fee.id)}
                    disabled={payingId === fee.id}
                    className="w-full py-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{payingId === fee.id ? 'Processing UPI Payment...' : 'Pay with UPI / Card (Zero Extra Fee)'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Receipt View Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200 animate-slide-up space-y-3">
            <div className="text-center pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-sm text-slate-900">Fee Payment Receipt</h3>
              <p className="text-[10px] text-slate-500">{receiptModal.receiptNo}</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Student Name:</span>
                <span className="font-bold text-slate-900">{student.firstName} {student.lastName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Class:</span>
                <span className="font-bold text-slate-900">{student.className}-{student.sectionName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fee Particular:</span>
                <span className="font-bold text-slate-900">{receiptModal.title}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Date:</span>
                <span className="font-bold text-slate-900">{receiptModal.paymentDate}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                <span className="font-bold">Total Amount Paid:</span>
                <span className="font-black text-sm text-emerald-700">₹{receiptModal.amount.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setReceiptModal(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition mt-2"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
