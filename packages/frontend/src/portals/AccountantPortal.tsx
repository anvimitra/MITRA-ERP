import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { FeeStructure, FeePayment } from '../types';
import { Receipt, CreditCard, Send, Plus, Search, CheckCircle2, AlertCircle, Printer, X } from 'lucide-react';

export const AccountantPortal: React.FC = () => {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  // Collection modal state
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('stu-priya-02'); // Priya has pending fee
  const [selectedFeeStructId, setSelectedFeeStructId] = useState('');
  const [amountPaid, setAmountPaid] = useState('18500');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Receipt view state
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);

  // Reminder feedback state
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getFeeStructures();
      setStructures(res.structures || []);
      if (res.structures?.length > 0) {
        setSelectedFeeStructId(res.structures[0].id);
      }
    } catch (err) {
      console.error('Error loading fee structures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiService.collectFee({
        studentId: selectedStudentId,
        feeStructureId: selectedFeeStructId,
        amountPaid: Number(amountPaid),
        paymentMode,
        remarks: paymentRemarks,
      });

      setLatestReceipt({
        ...res.payment,
        studentName: selectedStudentId === 'stu-priya-02' ? 'Priya Patel' : 'Rahul Sharma',
        feeTitle: 'Tuition Fee - Quarter 1',
        paymentMode,
      });

      setShowCollectModal(false);
      alert('✅ Fee payment recorded & official receipt generated!');
    } catch (err: any) {
      alert('Error collecting fee: ' + err.message);
    }
  };

  const handleSendReminder = async (studentId: string, name: string, dueAmount: number) => {
    try {
      const res = await ApiService.sendFeeReminder(studentId, dueAmount, '2026-09-15');
      setReminderStatus(
        `✅ Reminder sent to ${name}! Channel: ${res.dispatchResult?.channel} (${res.dispatchResult?.recipientPhone})`
      );
    } catch (err: any) {
      alert('Error sending reminder: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Receipt size={16} /> Bursar & Accounts Office
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Fee Management & Billing Counter</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Collect school fees, issue authenticated printable receipts, and trigger automated reminders via mobile push notifications or SMS fallback.
          </p>
        </div>

        <button
          onClick={() => setShowCollectModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition"
        >
          <CreditCard size={18} />
          <span>Collect Fee Counter</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Term Dues</span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹ 92,000</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Class 10 Combined</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Collected Revenue</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">₹ 37,000</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1">Direct Bank & Cash</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Pending Balance</span>
          <div className="text-2xl font-black text-rose-700 mt-1">₹ 55,000</div>
          <span className="text-[11px] text-rose-600 font-semibold mt-1">Actionable Defaulters</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Automated Reminders</span>
          <div className="text-2xl font-black text-blue-700 mt-1">100% Sent</div>
          <span className="text-[11px] text-blue-600 font-semibold mt-1">App Push + SMS Fallback</span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {reminderStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{reminderStatus}</span>
          <button onClick={() => setReminderStatus(null)} className="text-emerald-700 hover:text-emerald-950">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Pending Fee Reminders Queue */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Students Fee Ledger & Automated Reminder Dispatch</h2>
        <p className="text-xs text-slate-500 mb-4">
          Click "Send Reminder" to trigger instant app push alert, or automated Text SMS if parent does not have the app.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Father / Guardian</th>
                <th className="py-3 px-4">Primary Phone</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">App Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Priya Patel */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">Priya Patel (DPS/2026/1002)</td>
                <td className="py-3 px-4">Class 10 - A</td>
                <td className="py-3 px-4 font-semibold text-slate-700">Mr. Suresh Patel</td>
                <td className="py-3 px-4 font-mono text-slate-600">+91 98222 33445</td>
                <td className="py-3 px-4 font-bold text-rose-600">₹ 23,000</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Inactive (SMS Fallback)
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleSendReminder('stu-priya-02', 'Priya Patel', 23000)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition flex items-center gap-1 mx-auto"
                  >
                    <Send size={12} /> Send Text SMS Reminder
                  </button>
                </td>
              </tr>

              {/* Rahul Sharma */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">Rahul Sharma (DPS/2026/1001)</td>
                <td className="py-3 px-4">Class 10 - A</td>
                <td className="py-3 px-4 font-semibold text-slate-700">Mr. Manoj Sharma</td>
                <td className="py-3 px-4 font-mono text-slate-600">+91 98111 22334</td>
                <td className="py-3 px-4 font-bold text-emerald-600">₹ 4,500 (Exam fee)</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active on Mobile App
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleSendReminder('stu-rahul-01', 'Rahul Sharma', 4500)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition flex items-center gap-1 mx-auto"
                  >
                    <Send size={12} /> Send App Push Reminder
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Fee Receipt Modal / Card if generated */}
      {latestReceipt && (
        <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-2xl max-w-xl mx-auto my-6 font-mono text-xs">
          <div className="flex justify-between items-start border-b border-slate-400 pb-3">
            <div>
              <h3 className="font-sans font-bold text-base uppercase text-slate-900">Delhi Public Global Academy</h3>
              <p className="text-[10px] text-slate-500">OFFICIAL FEE RECEIPT • NEW DELHI</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-700 block text-sm">{latestReceipt.receiptNo}</span>
              <span className="text-[10px] text-slate-400">Date: {latestReceipt.paymentDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 my-4 text-[11px]">
            <div>Student: <strong>{latestReceipt.studentName}</strong></div>
            <div>Mode: <strong className="uppercase">{latestReceipt.paymentMode}</strong></div>
            <div>Fee Head: <strong>{latestReceipt.feeTitle}</strong></div>
            <div>Status: <strong className="text-emerald-700 uppercase">{latestReceipt.status}</strong></div>
          </div>

          <div className="border-t border-b border-slate-300 py-3 my-3 flex justify-between items-center text-sm font-bold">
            <span>Amount Received:</span>
            <span className="text-slate-900 text-base">₹ {latestReceipt.amountPaid.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-end pt-4">
            <span className="text-[10px] text-slate-400">Computer Generated Receipt • No Signature Required</span>
            <button
              onClick={() => window.print()}
              className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-sans font-bold rounded-lg"
            >
              <Printer size={13} /> Print Receipt
            </button>
          </div>
        </div>
      )}

      {/* Collect Fee Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Fee Counter Collection</h3>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCollectFee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="stu-priya-02">Priya Patel (Class 10-A) • Due: ₹ 23,000</option>
                  <option value="stu-rahul-01">Rahul Sharma (Class 10-A) • Due: ₹ 4,500</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fee Head</label>
                <select
                  value={selectedFeeStructId}
                  onChange={(e) => setSelectedFeeStructId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} (₹ {s.amount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold uppercase"
                  >
                    <option value="cash">Cash Counter</option>
                    <option value="upi">UPI (GPay / PhonePe)</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="cheque">Bank Cheque</option>
                    <option value="netbanking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref #492819389201"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow"
                >
                  Record & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
