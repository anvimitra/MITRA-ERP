import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { VisitorItem, InquiryItem, PostalComplaintItem } from '../types';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  X,
  Building,
  FileText,
  MessageSquare,
  Package,
} from 'lucide-react';

export const FrontDeskReception: React.FC = () => {
  const [subTab, setSubTab] = useState<'visitors' | 'inquiries' | 'postal'>('visitors');

  // Visitors
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorPurpose, setVisitorPurpose] = useState('');
  const [whomToMeet, setWhomToMeet] = useState('');
  const [idCardType, setIdCardType] = useState('Aadhaar Card');
  const [idCardNo, setIdCardNo] = useState('');

  // Inquiries
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inqStudentName, setInqStudentName] = useState('');
  const [inqParentName, setInqParentName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqClass, setInqClass] = useState('Class 1');
  const [inqSource, setInqSource] = useState('Walk-in');
  const [inqFollowUp, setInqFollowUp] = useState('');
  const [inqNotes, setInqNotes] = useState('');

  // Postal & Complaints
  const [postalList, setPostalList] = useState<PostalComplaintItem[]>([]);
  const [showPostalModal, setShowPostalModal] = useState(false);
  const [postalType, setPostalType] = useState<'POSTAL_DISPATCH' | 'POSTAL_RECEIVE' | 'COMPLAINT' | 'CALL_LOG'>('COMPLAINT');
  const [postalTitle, setPostalTitle] = useState('');
  const [postalRef, setPostalRef] = useState('');
  const [postalFrom, setPostalFrom] = useState('');
  const [postalTo, setPostalTo] = useState('');
  const [postalPhone, setPostalPhone] = useState('');
  const [postalDesc, setPostalDesc] = useState('');

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [vRes, iRes, pRes] = await Promise.all([
        ApiService.getVisitors(),
        ApiService.getInquiries(),
        ApiService.getPostalComplaints(),
      ]);
      setVisitors(vRes.visitors || []);
      setInquiries(iRes.inquiries || []);
      setPostalList(pRes.items || []);
    } catch (err: any) {
      console.error('Error loading front desk:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Register visitor
  const handleRegisterVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createVisitor({
        visitorName,
        phone: visitorPhone,
        purpose: visitorPurpose,
        whomToMeet,
        idCardType,
        idCardNo,
      });
      alert('✅ Visitor registered! Entry pass generated.');
      setShowVisitorModal(false);
      setVisitorName('');
      setVisitorPhone('');
      setVisitorPurpose('');
      setWhomToMeet('');
      setIdCardNo('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Checkout visitor
  const handleCheckoutVisitor = async (id: string) => {
    try {
      await ApiService.checkoutVisitor(id);
      loadAll();
    } catch (err: any) {
      alert('Error checking out visitor: ' + err.message);
    }
  };

  // Add inquiry
  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createInquiry({
        studentName: inqStudentName,
        parentName: inqParentName,
        phone: inqPhone,
        email: inqEmail,
        classSeeking: inqClass,
        source: inqSource,
        followUpDate: inqFollowUp,
        notes: inqNotes,
      });
      alert('✅ Admission inquiry logged into CRM!');
      setShowInquiryModal(false);
      setInqStudentName('');
      setInqParentName('');
      setInqPhone('');
      setInqEmail('');
      setInqNotes('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Update inquiry status
  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    try {
      await ApiService.updateInquiry(id, { status });
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Create postal / complaint
  const handleCreatePostal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createPostalComplaint({
        type: postalType,
        title: postalTitle,
        referenceNo: postalRef,
        fromName: postalFrom,
        toName: postalTo,
        contactPhone: postalPhone,
        description: postalDesc,
        status: postalType === 'COMPLAINT' ? 'PENDING' : 'RECEIVED',
      });
      alert('✅ Record logged successfully!');
      setShowPostalModal(false);
      setPostalTitle('');
      setPostalRef('');
      setPostalFrom('');
      setPostalTo('');
      setPostalDesc('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Resolve complaint
  const handleResolveComplaint = async (id: string) => {
    const action = prompt('Enter action taken / resolution remarks:');
    if (!action) return;
    try {
      await ApiService.updatePostalComplaint(id, { actionTaken: action, status: 'RESOLVED' });
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Building size={16} />
            <span>School Reception & Administration</span>
          </div>
          <h1 className="text-2xl font-black">Front Desk & Visitor Management</h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-xl">
            Streamline gate security passes, admission candidate inquiries CRM, postal courier registers, and parent grievance resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'visitors' && (
            <button
              onClick={() => setShowVisitorModal(true)}
              className="bg-white text-teal-800 hover:bg-emerald-50 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
            >
              <UserPlus size={16} />
              <span>Issue Visitor Pass</span>
            </button>
          )}
          {subTab === 'inquiries' && (
            <button
              onClick={() => setShowInquiryModal(true)}
              className="bg-white text-teal-800 hover:bg-emerald-50 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
            >
              <Plus size={16} />
              <span>Log Admission Inquiry</span>
            </button>
          )}
          {subTab === 'postal' && (
            <button
              onClick={() => setShowPostalModal(true)}
              className="bg-white text-teal-800 hover:bg-emerald-50 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
            >
              <Plus size={16} />
              <span>Add Postal / Grievance</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('visitors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'visitors'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={16} />
          <span>Visitor Gate Pass Log ({visitors.filter((v) => v.status === 'IN').length} Active)</span>
        </button>
        <button
          onClick={() => setSubTab('inquiries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'inquiries'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare size={16} />
          <span>Admission Inquiries CRM ({inquiries.length})</span>
        </button>
        <button
          onClick={() => setSubTab('postal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'postal'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package size={16} />
          <span>Postal Courier & Grievances ({postalList.length})</span>
        </button>
      </div>

      {/* ================= 1. VISITORS LOG ================= */}
      {subTab === 'visitors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-xs">Today's Campus Visitors</h3>
            <span className="text-[11px] text-slate-400 font-mono">Date: {new Date().toLocaleDateString('en-IN')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Pass #</th>
                  <th className="py-3 px-4">Visitor Name & Phone</th>
                  <th className="py-3 px-4">Whom To Meet</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {v.badgeNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{v.visitorName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{v.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {v.whomToMeet}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {v.purpose}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {v.checkIn}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {v.checkOut || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {v.status === 'IN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                          ● On Campus
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Checked Out
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.status === 'IN' && (
                        <button
                          onClick={() => handleCheckoutVisitor(v.id)}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold transition text-[11px]"
                        >
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 2. ADMISSION INQUIRIES ================= */}
      {subTab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Candidate Student</th>
                  <th className="py-3 px-4">Parent Details</th>
                  <th className="py-3 px-4">Seeking Class</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Follow-Up Date</th>
                  <th className="py-3 px-4">Notes / Remarks</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{inq.studentName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-semibold">{inq.parentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inq.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-700">
                      {inq.classSeeking}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {inq.source || 'Walk-in'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {inq.followUpDate || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {inq.notes || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={inq.status}
                        onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                          inq.status === 'CONVERTED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : inq.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : inq.status === 'NEW'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-300'
                        }`}
                      >
                        <option value="NEW">New Lead</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="CONVERTED">Enrolled / Converted</option>
                        <option value="CLOSED">Closed / Dropped</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 3. POSTAL & COMPLAINTS ================= */}
      {subTab === 'postal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Reference & Title</th>
                  <th className="py-3 px-4">From / Sender</th>
                  <th className="py-3 px-4">Addressed To</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Resolution / Action</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {postalList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border">
                        {item.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{item.title}</div>
                      {item.referenceNo && (
                        <div className="text-[10px] text-slate-400 font-mono">Ref: {item.referenceNo}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.fromName || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.toName || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {item.date}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {item.actionTaken || 'Pending review'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.status === 'RESOLVED' || item.status === 'RECEIVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => handleResolveComplaint(item.id)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold transition text-[11px]"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visitor Modal */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-teal-800 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Issue Visitor Security Pass</h3>
              <button onClick={() => setShowVisitorModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleRegisterVisitor} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Visitor Full Name *</label>
                <input required value={visitorName} onChange={(e) => setVisitorName(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Phone Number *</label>
                <input required value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Purpose of Visit *</label>
                <input required value={visitorPurpose} onChange={(e) => setVisitorPurpose(e.target.value)} placeholder="e.g. Admission / Meeting Principal" className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Whom to Meet</label>
                <input value={whomToMeet} onChange={(e) => setWhomToMeet(e.target.value)} placeholder="e.g. Vice Principal / Accounts Desk" className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">ID Card Type</label>
                  <select value={idCardType} onChange={(e) => setIdCardType(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl">
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">ID Number</label>
                  <input value={idCardNo} onChange={(e) => setIdCardNo(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowVisitorModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-700 text-white rounded-xl font-bold shadow">Issue Pass</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-teal-800 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Record Admission Candidate Inquiry</h3>
              <button onClick={() => setShowInquiryModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateInquiry} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Student / Candidate Name *</label>
                <input required value={inqStudentName} onChange={(e) => setInqStudentName(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Parent Name *</label>
                  <input required value={inqParentName} onChange={(e) => setInqParentName(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Contact Phone *</label>
                  <input required value={inqPhone} onChange={(e) => setInqPhone(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Class Seeking</label>
                  <input value={inqClass} onChange={(e) => setInqClass(e.target.value)} placeholder="e.g. Class 9" className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Source</label>
                  <select value={inqSource} onChange={(e) => setInqSource(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl">
                    <option value="Walk-in">Walk-in</option>
                    <option value="Online Website">Online Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Follow-Up Date</label>
                <input type="date" value={inqFollowUp} onChange={(e) => setInqFollowUp(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Notes / Discussion Summary</label>
                <textarea rows={2} value={inqNotes} onChange={(e) => setInqNotes(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl resize-none" />
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowInquiryModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-700 text-white rounded-xl font-bold shadow">Save Inquiry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Postal / Complaints Modal */}
      {showPostalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-teal-800 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Log Postal / Grievance Record</h3>
              <button onClick={() => setShowPostalModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePostal} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Record Type</label>
                <select value={postalType} onChange={(e) => setPostalType(e.target.value as any)} className="w-full p-2 bg-slate-50 border rounded-xl">
                  <option value="COMPLAINT">Parent / Student Grievance Complaint</option>
                  <option value="POSTAL_RECEIVE">Inward Postal / Courier Received</option>
                  <option value="POSTAL_DISPATCH">Outward Postal / Courier Dispatch</option>
                  <option value="CALL_LOG">Phone Call Log</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Title / Subject *</label>
                <input required value={postalTitle} onChange={(e) => setPostalTitle(e.target.value)} placeholder="e.g. Bus delay issue / CBSE Circular" className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">From / Sender</label>
                  <input value={postalFrom} onChange={(e) => setPostalFrom(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">To / Recipient</label>
                  <input value={postalTo} onChange={(e) => setPostalTo(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Description</label>
                <textarea rows={2} value={postalDesc} onChange={(e) => setPostalDesc(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl resize-none" />
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowPostalModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-700 text-white rounded-xl font-bold shadow">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
