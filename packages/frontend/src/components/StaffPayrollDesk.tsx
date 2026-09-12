import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { StaffLeaveItem, StaffPayrollItem } from '../types';
import {
  Users,
  CreditCard,
  FileText,
  Check,
  X,
  Plus,
  Printer,
  Calendar,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  DollarSign,
} from 'lucide-react';

interface StaffPayrollDeskProps {
  staffList: any[];
}

export const StaffPayrollDesk: React.FC<StaffPayrollDeskProps> = ({ staffList }) => {
  const [subTab, setSubTab] = useState<'leaves' | 'payroll'>('leaves');

  // Leaves
  const [leaves, setLeaves] = useState<StaffLeaveItem[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  // Payroll
  const [slips, setSlips] = useState<StaffPayrollItem[]>([]);
  const [loadingSlips, setLoadingSlips] = useState(true);
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Generate Slip form
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [monthYear, setMonthYear] = useState('2026-09');
  const [basicSalary, setBasicSalary] = useState(40000);
  const [hra, setHra] = useState(16000);
  const [da, setDa] = useState(8000);
  const [specialAllowance, setSpecialAllowance] = useState(4000);
  const [deductionPf, setDeductionPf] = useState(4800);
  const [deductionTax, setDeductionTax] = useState(2000);
  const [deductionLeave, setDeductionLeave] = useState(0);

  // Print Slip modal
  const [printSlip, setPrintSlip] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoadingLeaves(true);
      setLoadingSlips(true);
      const [lRes, sRes] = await Promise.all([
        ApiService.getStaffLeaves(),
        ApiService.getPayrollSlips(),
      ]);
      setLeaves(lRes.leaves || []);
      setSlips(sRes.slips || []);
    } catch (err: any) {
      console.error('Error loading payroll desk:', err);
    } finally {
      setLoadingLeaves(false);
      setLoadingSlips(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewLeave = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const remarks = prompt(`Enter ${status} remarks for staff member (optional):`);
    try {
      await ApiService.reviewStaffLeave(id, status, remarks || undefined);
      loadData();
    } catch (err: any) {
      alert('Review action failed: ' + err.message);
    }
  };

  const handleGenerateSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      alert('Please select a staff member.');
      return;
    }

    try {
      await ApiService.generatePayrollSlip({
        staffUserId: selectedStaffId,
        monthYear,
        basicSalary,
        hra,
        da,
        specialAllowance,
        deductionPf,
        deductionTax,
        deductionLeave,
        paymentMode: 'BANK_TRANSFER',
        paymentStatus: 'PAID',
      });

      alert('✅ Salary slip generated and processed for disbursement!');
      setShowSlipModal(false);
      loadData();
    } catch (err: any) {
      alert('Salary generation failed: ' + err.message);
    }
  };

  const handleOpenPrint = async (slipId: string) => {
    try {
      const res = await ApiService.getPayrollSlipDetail(slipId);
      if (res.slip) {
        setPrintSlip(res.slip);
      }
    } catch (err: any) {
      alert('Error fetching salary slip: ' + err.message);
    }
  };

  const grossSalary = basicSalary + hra + da + specialAllowance;
  const totalDeductions = deductionPf + deductionTax + deductionLeave;
  const netPayable = Math.max(0, grossSalary - totalDeductions);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Briefcase size={16} />
            <span>Human Resources & Compensation</span>
          </div>
          <h1 className="text-2xl font-black">Staff HR & Payroll Management</h1>
          <p className="text-xs text-purple-200 mt-1 max-w-xl">
            Authorize faculty leave applications, track staff attendance balances, and disburse monthly institutional salary pay slips.
          </p>
        </div>

        {subTab === 'payroll' && (
          <button
            onClick={() => setShowSlipModal(true)}
            className="bg-white text-purple-900 hover:bg-purple-50 px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
          >
            <Plus size={16} />
            <span>Generate Monthly Salary Slip</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('leaves')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'leaves'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={16} />
          <span>Staff Leave Applications ({leaves.filter((l) => l.status === 'PENDING').length} Pending)</span>
        </button>
        <button
          onClick={() => setSubTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'payroll'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard size={16} />
          <span>Monthly Salary Slips Ledger ({slips.length})</span>
        </button>
      </div>

      {/* ================= 1. STAFF LEAVES TABLE ================= */}
      {subTab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loadingLeaves ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading faculty leave requests...</div>
          ) : leaves.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No leave requests currently pending.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Faculty / Staff Member</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Total Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{l.staffName}</div>
                        <div className="text-[11px] text-slate-400">{l.staffRole} • {l.staffEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border">
                          {l.leaveType} LEAVE
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {l.startDate} to {l.endDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-700">
                        {l.totalDays} Day{l.totalDays > 1 ? 's' : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {l.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            l.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : l.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {l.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReviewLeave(l.id, 'APPROVED')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewLeave(l.id, 'REJECTED')}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] border border-rose-200 transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. PAYROLL & SALARY SLIPS ================= */}
      {subTab === 'payroll' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loadingSlips ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading payroll ledger...</div>
          ) : slips.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No salary slips generated yet for this session.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Slip #</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Month / Year</th>
                    <th className="py-3 px-4">Basic Pay</th>
                    <th className="py-3 px-4">Allowances</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Net Payable</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {slips.map((s) => {
                    const allowances = (s.hra || 0) + (s.da || 0) + (s.specialAllowance || 0);
                    const deductions = (s.deductionPf || 0) + (s.deductionTax || 0) + (s.deductionLeave || 0);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">
                          {s.slipNo}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{s.staffName}</div>
                          <div className="text-[11px] text-slate-400">{s.staffRole}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {s.monthYear}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-700">
                          ₹{Number(s.basicSalary).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">
                          +₹{allowances.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-rose-600 font-bold">
                          -₹{deductions.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 text-sm">
                          ₹{Number(s.netSalary).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            {s.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenPrint(s.id)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl font-bold flex items-center gap-1.5 transition ml-auto"
                          >
                            <Printer size={13} />
                            <span>Print Slip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= GENERATE SALARY SLIP MODAL ================= */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-purple-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-black">Generate Monthly Salary Slip</h3>
                <p className="text-xs text-purple-300">Auto-computes allowances, PF deductions, and net salary</p>
              </div>
              <button onClick={() => setShowSlipModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleGenerateSlip} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Select Staff Member *</label>
                  <select
                    required
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  >
                    <option value="">-- Choose Staff --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Salary Month / Year *</label>
                  <input
                    type="month"
                    required
                    value={monthYear}
                    onChange={(e) => setMonthYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              {/* Earnings */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <Plus size={14} />
                  <span>Earnings & Allowances</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Basic Salary (₹)</label>
                    <input
                      type="number"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">HRA (₹)</label>
                    <input
                      type="number"
                      value={hra}
                      onChange={(e) => setHra(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Dearness Allowance (DA) (₹)</label>
                    <input
                      type="number"
                      value={da}
                      onChange={(e) => setDa(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Special / Other Allowances (₹)</label>
                    <input
                      type="number"
                      value={specialAllowance}
                      onChange={(e) => setSpecialAllowance(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3">
                <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                  <X size={14} />
                  <span>Statutory & Leave Deductions</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Provident Fund (PF)</label>
                    <input
                      type="number"
                      value={deductionPf}
                      onChange={(e) => setDeductionPf(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Income Tax (TDS)</label>
                    <input
                      type="number"
                      value={deductionTax}
                      onChange={(e) => setDeductionTax(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Unpaid Leaves</label>
                    <input
                      type="number"
                      value={deductionLeave}
                      onChange={(e) => setDeductionLeave(Number(e.target.value))}
                      className="w-full p-2 bg-white border rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Computation Banner */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Net Payable Salary</div>
                  <div className="text-xl font-black text-emerald-400">
                    ₹{netPayable.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  Gross: ₹{grossSalary.toLocaleString('en-IN')} • Deductions: ₹{totalDeductions.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSlipModal(false)}
                  className="px-4 py-2 text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-lg shadow-purple-700/20"
                >
                  Process & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PRINT SALARY SLIP MODAL ================= */}
      {printSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center print:hidden">
              <span className="text-xs font-bold uppercase">Official Pay Slip: {printSlip.slipNo}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Printer size={14} />
                  <span>Print Slip</span>
                </button>
                <button onClick={() => setPrintSlip(null)}><X size={18} /></button>
              </div>
            </div>

            <div className="p-8 font-sans text-xs border border-slate-300 m-4 rounded-xl bg-white space-y-6">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-300">
                <h2 className="text-lg font-black uppercase text-slate-900">{printSlip.school?.name || 'DELHI PUBLIC SCHOOL'}</h2>
                <p className="text-slate-500 text-[11px]">{printSlip.school?.address || 'Sector 12, RK Puram, New Delhi'}</p>
                <h3 className="font-bold text-slate-800 text-xs mt-2 bg-slate-100 py-1 rounded">
                  SALARY PAY SLIP FOR THE MONTH OF {printSlip.monthYear}
                </h3>
              </div>

              {/* Employee Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <div><strong>Employee Name:</strong> {printSlip.staff?.name}</div>
                  <div><strong>Designation:</strong> {printSlip.staff?.role}</div>
                  <div><strong>Slip No:</strong> {printSlip.slipNo}</div>
                </div>
                <div>
                  <div><strong>Payment Mode:</strong> {printSlip.paymentMode}</div>
                  <div><strong>Status:</strong> {printSlip.paymentStatus}</div>
                  <div><strong>Disbursement Date:</strong> {printSlip.paymentDate}</div>
                </div>
              </div>

              {/* Earnings vs Deductions Matrix */}
              <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg overflow-hidden">
                {/* Earnings */}
                <div className="border-r border-slate-300">
                  <div className="bg-slate-100 font-bold p-2 text-center border-b border-slate-300">Earnings</div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between"><span>Basic Pay</span><span>₹{Number(printSlip.basicSalary).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>HRA</span><span>₹{Number(printSlip.hra || 0).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>DA</span><span>₹{Number(printSlip.da || 0).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Special Allowance</span><span>₹{Number(printSlip.specialAllowance || 0).toLocaleString('en-IN')}</span></div>
                    <div className="border-t pt-1.5 flex justify-between font-bold text-emerald-800">
                      <span>Total Earnings</span>
                      <span>₹{(printSlip.basicSalary + (printSlip.hra || 0) + (printSlip.da || 0) + (printSlip.specialAllowance || 0)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <div className="bg-slate-100 font-bold p-2 text-center border-b border-slate-300">Deductions</div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between"><span>Provident Fund (PF)</span><span>₹{Number(printSlip.deductionPf || 0).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Income Tax (TDS)</span><span>₹{Number(printSlip.deductionTax || 0).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Unpaid Leaves</span><span>₹{Number(printSlip.deductionLeave || 0).toLocaleString('en-IN')}</span></div>
                    <div className="border-t pt-1.5 flex justify-between font-bold text-rose-800">
                      <span>Total Deductions</span>
                      <span>₹{((printSlip.deductionPf || 0) + (printSlip.deductionTax || 0) + (printSlip.deductionLeave || 0)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-center font-bold text-sm text-purple-950">
                <span>NET TAKE-HOME PAY:</span>
                <span className="text-lg">₹{Number(printSlip.netSalary).toLocaleString('en-IN')}</span>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 text-center font-bold text-[11px] text-slate-700">
                <div>
                  <div className="h-8 border-b border-slate-400 mx-8 mb-1"></div>
                  <span>Employee Signature</span>
                </div>
                <div>
                  <div className="h-8 border-b border-slate-400 mx-8 mb-1 flex items-end justify-center">
                    <span className="font-serif italic text-blue-900">Dr. Rajesh Khanna</span>
                  </div>
                  <span>Authorized Signatory / Principal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
