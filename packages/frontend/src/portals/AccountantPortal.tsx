import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { FeeStructure, FeePayment } from '../types';
import {
  Receipt,
  CreditCard,
  Send,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
  History,
  FileText,
  DollarSign,
  Download,
} from 'lucide-react';

export const AccountantPortal: React.FC = () => {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'collection' | 'structures' | 'history' | 'defaulters'>('collection');

  // Collection modal state
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFeeStructId, setSelectedFeeStructId] = useState('');
  const [amountPaid, setAmountPaid] = useState('15000');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentRemarks, setPaymentRemarks] = useState('Quarter 1 Tuition Fee Paid');

  // Add Fee Structure Modal
  const [showAddStructModal, setShowAddStructModal] = useState(false);
  const [structTitle, setStructTitle] = useState('');
  const [structAmount, setStructAmount] = useState('');
  const [structClassId, setStructClassId] = useState('');
  const [structDueDate, setStructDueDate] = useState('2026-10-15');

  // Receipt view state
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);

  // Reminder feedback state
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fRes, sRes, pRes, cRes] = await Promise.all([
        ApiService.getFeeStructures(),
        ApiService.getStudents(),
        ApiService.getPayments(),
        ApiService.getClasses(),
      ]);

      setStructures(fRes.structures || []);
      setStudents(sRes.students || []);
      setPayments(pRes.payments || []);
      setClassesData(cRes);

      if (sRes.students?.length > 0) {
        setSelectedStudentId(sRes.students[0].id);
      }
      if (fRes.structures?.length > 0) {
        setSelectedFeeStructId(fRes.structures[0].id);
        setAmountPaid(String(fRes.structures[0].amount));
      }
      if (cRes.classes?.length > 0) {
        setStructClassId(cRes.classes[0].id);
      }
    } catch (err) {
      console.error('Error loading accounts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedFeeStructId) {
      alert('Please select both a student and a fee structure');
      return;
    }

    try {
      const res = await ApiService.collectFee({
        studentId: selectedStudentId,
        feeStructureId: selectedFeeStructId,
        amountPaid: Number(amountPaid),
        paymentMode,
        remarks: paymentRemarks,
      });

      const selectedStudent = students.find((s) => s.id === selectedStudentId);
      const selectedStruct = structures.find((st) => st.id === selectedFeeStructId);

      setLatestReceipt({
        ...res.payment,
        studentName: selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName || ''}`.trim() : 'Student',
        admissionNo: selectedStudent?.admissionNo || 'N/A',
        className: selectedStudent?.className || 'Class 10',
        feeTitle: selectedStruct?.title || 'Tuition Fee',
        paymentMode,
        remarks: paymentRemarks,
      });

      setShowCollectModal(false);
      alert('✅ Fee payment recorded & official receipt generated!');
      loadData();
    } catch (err: any) {
      alert('Error collecting fee: ' + err.message);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structTitle || !structAmount || !structClassId) return;

    try {
      // Direct fetch or API call
      const token = ApiService.getToken();
      const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000/api';
      const res = await fetch(`${API_BASE}/fees/structures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classId: structClassId,
          title: structTitle,
          amount: Number(structAmount),
          dueDate: structDueDate,
          academicYear: '2026-2027',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create fee head');
      }

      alert('✅ New Fee Head added to institutional ledger!');
      setShowAddStructModal(false);
      setStructTitle('');
      setStructAmount('');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSendReminder = async (studentId: string, name: string, dueAmount: number) => {
    try {
      const res = await ApiService.sendFeeReminder(studentId, dueAmount, '2026-10-15');
      setReminderStatus(
        `✅ Automated fee reminder sent to ${name} (${res.dispatchResult?.recipientPhone || 'App Notification'})`
      );
    } catch (err: any) {
      alert('Error sending reminder: ' + err.message);
    }
  };

  const totalCollected = payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-900/50">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
            <Receipt size={16} /> Institutional Bursar & Cash Counter
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Fee Management & Billing Desk</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Accept fee payments, generate authenticated dual-copy receipts, configure fee heads, and track defaulter dues with automated SMS reminders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddStructModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
          >
            <Plus size={16} />
            <span>Add Fee Head</span>
          </button>
          <button
            onClick={() => setShowCollectModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
          >
            <CreditCard size={16} />
            <span>Accept Fee Counter</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('collection')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'collection' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <DollarSign size={15} />
          <span>Fee Counter & Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'history' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <History size={15} />
          <span>Payment Transactions ({payments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'structures' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileText size={15} />
          <span>Fee Heads ({structures.length})</span>
        </button>
      </div>

      {reminderStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
          <span>{reminderStatus}</span>
          <button onClick={() => setReminderStatus(null)} className="text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ================= TAB 1: SUMMARY & COUNTER ================= */}
      {activeTab === 'collection' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Total Collected</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">₹{totalCollected.toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-slate-500 mt-1">{payments.length} Validated Receipts</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Registered Students</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{students.length} Pupils</div>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">All Enrolled Batches</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Active Fee Heads</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{structures.length} Categories</div>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">Tuition, Exams, Transport</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Collection Status</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">Operational</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Cash, UPI & Bank Deposit</p>
            </div>
          </div>

          {/* Quick Collect Bar */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-emerald-950">Fast Fee Counter Desk</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Collect dues from any enrolled student and print an official authenticated school receipt immediately.
              </p>
            </div>
            <button
              onClick={() => setShowCollectModal(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <CreditCard size={16} />
              <span>Open Collection Window</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TRANSACTIONS HISTORY ================= */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="text-emerald-600" size={18} /> Official Transaction Audit Log
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Fee Head</th>
                  <th className="px-4 py-3">Amount Paid</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No fee payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">{p.receiptNo}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.studentName}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{p.feeTitle}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">₹{Number(p.amountPaid).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded uppercase text-[10px]">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.paymentDate}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setLatestReceipt(p)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] hover:bg-emerald-100 transition flex items-center gap-1 ml-auto"
                        >
                          <Printer size={12} />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: FEE STRUCTURES ================= */}
      {activeTab === 'structures' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-indigo-600" size={18} /> Active Institutional Fee Structures
            </h2>
            <button
              onClick={() => setShowAddStructModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>New Fee Head</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {structures.map((st) => (
              <div key={st.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-600 px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded">
                  Class {st.classId}
                </span>
                <div className="font-extrabold text-slate-900 text-base">{st.title}</div>
                <div className="text-2xl font-black text-slate-900">₹{st.amount.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-slate-500 font-medium">Due Date: {st.dueDate || 'End of Term'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: COLLECT FEE ================= */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowCollectModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">Fee Payment Counter</h3>
            <p className="text-xs text-slate-500 mb-6">Select student, fee category, amount, and receipt details.</p>

            <form onSubmit={handleCollectFee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-900"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} (Adm: {s.admissionNo}, Class {s.className}-{s.sectionName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fee Category *</label>
                <select
                  required
                  value={selectedFeeStructId}
                  onChange={(e) => {
                    setSelectedFeeStructId(e.target.value);
                    const st = structures.find((x) => x.id === e.target.value);
                    if (st) setAmountPaid(String(st.amount));
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-900"
                >
                  {structures.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.title} — ₹{st.amount.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paid (INR) *</label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-black text-base text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Channel *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="cash">Cash Counter</option>
                    <option value="upi">UPI / QR Transfer</option>
                    <option value="online">Net Banking / Card</option>
                    <option value="cheque">Cheque Deposit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Receipt Remarks</label>
                <input
                  type="text"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/30 transition"
                >
                  Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD FEE STRUCTURE ================= */}
      {showAddStructModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowAddStructModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">New Fee Structure</h3>
            <p className="text-xs text-slate-500 mb-5">Create an applicable fee head for a grade batch.</p>

            <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fee Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Composite Fee 2026-27"
                  value={structTitle}
                  onChange={(e) => setStructTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={structAmount}
                    onChange={(e) => setStructAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-black text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={structClassId}
                    onChange={(e) => setStructClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {classesData?.classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={structDueDate}
                  onChange={(e) => setStructDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStructModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30 transition"
                >
                  Create Fee Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINTABLE RECEIPT ================= */}
      {latestReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 relative my-6">
            <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Payment Verified & Stamped
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setLatestReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Layout */}
            <div className="border-2 border-slate-800 p-6 rounded-2xl font-serif text-slate-900 bg-amber-50/20">
              <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
                <span className="text-[10px] font-sans font-black tracking-widest text-slate-500 uppercase block">
                  Official Institutional Fee Challan & Receipt
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-950 font-serif mt-1">
                  LSK ACADEMY
                </h2>
                <p className="text-[11px] text-slate-600 font-sans">
                  CBSE Affiliated Senior Secondary School • Affiliation: 2130099
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  42-B, Shivaji Nagar, Bhopal, M.P. • Phone: +91 99887 76655
                </p>
              </div>

              <div className="grid grid-cols-2 text-xs font-sans mb-4 border-b border-slate-300 pb-3 gap-y-1.5">
                <div>
                  <span className="text-slate-500">Receipt No:</span>{' '}
                  <strong className="font-mono">{latestReceipt.receiptNo}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Date:</span>{' '}
                  <strong>{latestReceipt.paymentDate || new Date().toISOString().split('T')[0]}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Student:</span>{' '}
                  <strong className="uppercase">{latestReceipt.studentName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Admission No:</span>{' '}
                  <strong className="font-mono">{latestReceipt.admissionNo || 'LSK-ADM'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Class:</span>{' '}
                  <strong>{latestReceipt.className || 'Standard Batch'}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Payment Mode:</span>{' '}
                  <strong className="uppercase">{latestReceipt.paymentMode || 'CASH'}</strong>
                </div>
              </div>

              <table className="w-full text-xs font-sans border-collapse mb-4">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-100">
                    <th className="py-2 text-left px-2">Description</th>
                    <th className="py-2 text-right px-2">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-2 font-medium">{latestReceipt.feeTitle}</td>
                    <td className="py-2.5 px-2 text-right font-bold">
                      ₹{Number(latestReceipt.amountPaid).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-800 font-black text-sm bg-emerald-50/50">
                    <td className="py-2.5 px-2">TOTAL RECEIVED</td>
                    <td className="py-2.5 px-2 text-right text-emerald-800">
                      ₹{Number(latestReceipt.amountPaid).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-end pt-8 font-sans text-[11px] text-slate-600">
                <div>
                  <p className="italic">Computer Generated Validated Counter Receipt</p>
                  <p className="text-[10px] text-slate-400">Preserve this copy for annual tax rebate claim.</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-slate-800 w-36 mb-1"></div>
                  <span className="font-bold text-slate-900">Accounts Officer Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
