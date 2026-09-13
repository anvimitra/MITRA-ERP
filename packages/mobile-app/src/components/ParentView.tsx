import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, FeeItem, ExamReport, CertificateItem, StudentTransportItem, LibraryIssueItem, School } from '../types';
import { fetchStudentTransport, fetchCertificates, fetchLibraryIssues, fetchAdmitCard } from '../api';
import { CheckCircle2, AlertCircle, Clock, Award, ArrowRight, Wallet, Calendar, ShieldCheck, CreditCard, Sparkles, RefreshCw, Bus, FileText, BookOpen, Phone, Printer, X, MapPin, Download } from 'lucide-react';
import { TabType } from './BottomNavBar';

interface Props {
  student?: Student | null;
  school?: School | null;
  attendance: AttendanceRecord[];
  fees: FeeItem[];
  latestReport: ExamReport | null;
  onChangeTab: (tab: TabType) => void;
  onOpenIdCard?: () => void;
  onCheckUpdate?: () => void;
}

export const ParentView: React.FC<Props> = ({
  student,
  school,
  attendance,
  fees,
  latestReport,
  onChangeTab,
  onOpenIdCard,
  onCheckUpdate,
}) => {
  const todayRecord = attendance[0];
  const pendingFee = fees.find((f) => f.status === 'pending');
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const attendanceRate = Math.round((presentCount / (attendance.length || 1)) * 100);

  const [transport, setTransport] = useState<StudentTransportItem | null>(null);
  const [certs, setCerts] = useState<CertificateItem[]>([]);
  const [books, setBooks] = useState<LibraryIssueItem[]>([]);
  const [admitCard, setAdmitCard] = useState<any | null>(null);
  const [showAdmitCardModal, setShowAdmitCardModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);

  useEffect(() => {
    if (student?.id) {
      fetchStudentTransport(student.id).then(setTransport).catch(() => {});
      fetchCertificates(student.id).then(setCerts).catch(() => {});
      fetchLibraryIssues(student.id).then(setBooks).catch(() => {});
      fetchAdmitCard(student.id).then(setAdmitCard).catch(() => {});
    }
  }, [student?.id]);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 mb-3">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">No Student Linked</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          No student record is currently linked to this account. When school admits your ward, their profile and updates will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Student Profile Card */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-2xl p-4 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="relative">
            <img
              src={student.photoUrl}
              alt={student.firstName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">
              Roll #{student.rollNo}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-white truncate leading-snug">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-xs text-purple-200 font-medium">
              {student.className} - {student.sectionName} • Adm #{student.admissionNo}
            </p>
            <div className="flex items-center space-x-2 mt-1.5">
              <span className="bg-purple-800/80 text-purple-200 text-[10px] px-2 py-0.5 rounded-md font-semibold border border-purple-700">
                Blood: {student.bloodGroup}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                <span>App Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick ID Card & Auto-Update Actions in Card */}
        <div className="mt-3 pt-3 border-t border-purple-800/80 flex items-center justify-between">
          <button
            onClick={onOpenIdCard}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 text-xs font-black rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Digital ID Card</span>
          </button>

          <button
            onClick={onCheckUpdate}
            className="text-[10px] text-purple-200 hover:text-white flex items-center space-x-1 bg-purple-950/60 px-2.5 py-1.5 rounded-xl border border-purple-800"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span>Auto-Update: v1.2</span>
          </button>
        </div>
      </div>

      {/* Attendance Pulse Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Today's Attendance</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">{todayRecord?.date || 'Today'}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center space-x-3">
            {todayRecord?.status === 'present' ? (
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : todayRecord?.status === 'late' ? (
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="font-extrabold text-slate-900 text-sm capitalize">
                {todayRecord?.status === 'present'
                  ? 'Marked Present'
                  : todayRecord?.status === 'late'
                  ? 'Marked Late'
                  : 'Marked Absent'}
              </p>
              <p className="text-xs text-slate-500">{todayRecord?.remarks || 'Verified by Class Teacher'}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Monthly Rate</span>
            <span className="text-base font-extrabold text-purple-700">{attendanceRate}%</span>
          </div>
        </div>

        <button
          onClick={() => onChangeTab('attendance')}
          className="w-full mt-3 py-2 text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center justify-center space-x-1 transition"
        >
          <span>View Monthly Attendance History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fee Due Alert */}
      {pendingFee && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                  Fee Reminder
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{pendingFee.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Due: <span className="font-bold text-rose-600">{pendingFee.dueDate}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-slate-900">₹{pendingFee.amount.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => onChangeTab('fees')}
            className="w-full mt-3 py-2 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1"
          >
            <span>Pay Fee Online / View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Latest Academic Performance Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-purple-600" />
            <span>Latest Exam Performance</span>
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
            {latestReport.examType}
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-3">{latestReport.examName}</p>

        <div className="grid grid-cols-3 gap-2 p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-center">
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Total Marks</span>
            <span className="text-sm font-black text-purple-950">
              {latestReport.totalMarks}/{latestReport.maxTotalMarks}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Percentage</span>
            <span className="text-sm font-black text-purple-700">{latestReport.percentage}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Grade</span>
            <span className="text-sm font-black text-emerald-600">{latestReport.overallGrade}</span>
          </div>
        </div>

        <button
          onClick={() => onChangeTab('report')}
          className="w-full mt-3 py-2 text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center justify-center space-x-1 transition"
        >
          <span>Open Full Multi-Template Report Card</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* School Bus Tracker Card */}
      {transport && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">School Bus Tracking</h3>
                <p className="text-[11px] text-slate-500">{transport.routeName}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Bus Number</span>
              <strong className="font-mono text-slate-800">{transport.vehicleNo}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Boarding Stop</span>
              <strong className="text-slate-800 truncate block">{transport.stopName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Morning Pickup</span>
              <strong className="text-emerald-700 font-black">{transport.pickupTime}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Afternoon Drop</span>
              <strong className="text-blue-700 font-black">{transport.dropTime}</strong>
            </div>
          </div>

          <a
            href="tel:+919876543210"
            className="w-full py-2 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Driver (Rajesh Kumar)</span>
          </a>
        </div>
      )}

      {/* CBSE Examination Admit Card Card */}
      {admitCard && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-4 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
              CBSE Annual Exam 2026
            </span>
            <span className="text-[10px] font-mono text-amber-300 font-bold">
              Roll #{admitCard.rollNo}
            </span>
          </div>
          <h4 className="font-black text-sm">{admitCard.examTitle || 'Official Board Admit Card'}</h4>
          <p className="text-[11px] text-blue-200">
            Center #{admitCard.centerNumber}: {admitCard.centerName}
          </p>
          <button
            onClick={() => setShowAdmitCardModal(true)}
            className="w-full mt-2 py-2 bg-white active:bg-slate-100 text-slate-950 font-black text-xs rounded-xl shadow flex items-center justify-center space-x-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>View & Print Admit Card</span>
          </button>
        </div>
      )}

      {/* Library Borrowings Card */}
      {books.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Library Books ({books.length})</h3>
            </div>
          </div>

          <div className="space-y-2">
            {books.map((b, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 line-clamp-1">{b.bookTitle}</p>
                  <p className="text-[10px] text-slate-500">Due Date: {b.dueDate}</p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  b.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Academic Certificates Card */}
      {certs.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Issued Certificates ({certs.length})</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {certs.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCert(c)}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-left active:scale-95 transition space-y-1"
              >
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                  {c.certificateType}
                </span>
                <p className="text-xs font-black text-slate-800 line-clamp-1">{c.certificateNo}</p>
                <span className="text-[10px] text-purple-600 font-bold block">Tap to View →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADMIT CARD VIEW */}
      {showAdmitCardModal && admitCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-sm w-full bg-white rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-300">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-black uppercase text-blue-900">CBSE Admit Card 2026</span>
              <button onClick={() => setShowAdmitCardModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-sm uppercase">{admitCard.schoolName}</h3>
              <p className="text-[10px] text-slate-500">Affiliation No: {admitCard.schoolAffiliation}</p>
              <div className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-900 font-mono text-xs font-black rounded">
                Roll #{admitCard.rollNo} • Code: {admitCard.rollCode}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border text-xs space-y-1">
              <p><span className="text-slate-500">Candidate:</span> <strong>{admitCard.studentName}</strong></p>
              <p><span className="text-slate-500">Class:</span> <strong>{admitCard.className} - {admitCard.sectionName}</strong></p>
              <p><span className="text-slate-500">Center:</span> <strong>{admitCard.centerName}</strong></p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-black uppercase text-slate-700">Exam Timetable</p>
              <div className="max-h-36 overflow-y-auto divide-y border rounded-xl text-[11px]">
                {admitCard.schedule?.map((s: any, i: number) => (
                  <div key={i} className="p-2 flex justify-between">
                    <div>
                      <strong className="block text-slate-800">{s.subName}</strong>
                      <span className="text-[10px] text-slate-400">{s.subCode}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-700">{s.examDate}</span>
                      <span className="text-[10px] text-slate-500 block">{s.examTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Hall Ticket</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CERTIFICATE VIEW */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-sm w-full bg-white rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-300">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-black uppercase text-purple-900">{selectedCert.certificateType} Certificate</span>
              <button onClick={() => setSelectedCert(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-sm uppercase">{school?.name || 'School ERP'}</h3>
              <p className="text-[10px] text-slate-500">Ref: {selectedCert.certificateNo}</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-xs leading-relaxed text-slate-800">
              This certifies that <strong>{selectedCert.studentName || `${student.firstName} ${student.lastName}`}</strong> (Adm #{selectedCert.admissionNo || student.admissionNo}) is a bona fide student for Academic Year {selectedCert.academicYear}. Character & Conduct: <strong>{selectedCert.conduct || 'Good'}</strong>.
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Certificate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
