import React, { useState, useEffect } from 'react';
import { FeeItem, Student } from '../types';
import { fetchStudentFeesLedger } from '../api';
import { CreditCard, CheckCircle2, AlertCircle, Receipt, ShieldCheck, Clock, Building2 } from 'lucide-react';

interface Props {
  student?: Student | null;
  fees?: FeeItem[];
}

export const FeesView: React.FC<Props> = ({ student, fees: propFees }) => {
  const [fees, setFees] = useState<FeeItem[]>(propFees || []);
  const [receiptModal, setReceiptModal] = useState<FeeItem | null>(null);

  useEffect(() => {
    if (propFees) {
      setFees(propFees);
    } else if (student?.id) {
      fetchStudentFeesLedger(student.id).then(setFees).catch(() => setFees([]));
    }
  }, [student?.id, propFees]);

  const totalDue = fees
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + f.amount, 0);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
        <CreditCard className="w-10 h-10 text-slate-300 mb-2" />
        <h3 className="font-bold text-slate-800 text-sm">No Student Fee Account</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Please select or link a student account to view fees ledger and online payments.
        </p>
      </div>
    );
  }

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

      {/* Online Payment Gateway Coming Soon Notice */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 rounded-2xl p-3.5 shadow-xs flex items-start space-x-3">
        <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <CreditCard className="w-4 h-4 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-black text-xs text-amber-950">Online Payment Gateway</h4>
            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs animate-pulse">
              Coming Soon
            </span>
          </div>
          <p className="text-[11px] text-amber-900/90 mt-1 leading-relaxed">
            In-app UPI, Debit/Credit Card aur NetBanking suvidha jald hi activate ho rahi hai. Filhal fees school accounts office / counter par direct jama karein.
          </p>
        </div>
      </div>

      {/* Fee Items List */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Fee Invoices & Dues</h3>

        {fees.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No fee invoices or payment records found.
          </div>
        ) : (
          <div className="space-y-3">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className={`p-3.5 rounded-xl border transition ${
                  fee.status === 'paid' ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/40 border-amber-200'
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

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                  {fee.status === 'paid' ? (
                    <button
                      onClick={() => setReceiptModal(fee)}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Official Receipt</span>
                    </button>
                  ) : (
                    <div className="w-full space-y-1.5">
                      <div className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-200 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 text-slate-700">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-bold text-[11px] text-slate-800">Online Payment Gateway</span>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs tracking-wide shrink-0">
                          Coming Soon
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 px-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Kripya yeh installment school accounts counter par cash/cheque jama karein.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
                <span className="font-bold text-slate-900">{student ? `${student.firstName} ${student.lastName}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Class:</span>
                <span className="font-bold text-slate-900">{student ? `${student.className}-${student.sectionName}` : 'N/A'}</span>
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
