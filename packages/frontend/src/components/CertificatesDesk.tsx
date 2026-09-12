import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { CertificateItem, Student } from '../types';
import {
  Award,
  FileText,
  Plus,
  Printer,
  Trash2,
  Search,
  CheckCircle2,
  Calendar,
  User,
  GraduationCap,
  X,
  Building,
} from 'lucide-react';

interface CertificatesDeskProps {
  students?: Student[];
  schoolInfo?: any;
}

export const CertificatesDesk: React.FC<CertificatesDeskProps> = ({ students: propStudents, schoolInfo }) => {
  const [internalStudents, setInternalStudents] = useState<Student[]>([]);
  const students = (propStudents && propStudents.length > 0) ? propStudents : internalStudents;
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propStudents || propStudents.length === 0) {
      ApiService.getStudents().then(res => setInternalStudents(res.students || [])).catch(() => {});
    }
  }, [propStudents]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Issue modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [certType, setCertType] = useState<string>('TRANSFER_CERTIFICATE');
  const [reason, setReason] = useState('');
  const [conduct, setConduct] = useState('Exemplary');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Print modal
  const [printCert, setPrintCert] = useState<any | null>(null);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getCertificates();
      setCertificates(res.certificates || []);
    } catch (err: any) {
      console.error('Error loading certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !certType) {
      alert('Please select a student and certificate type.');
      return;
    }

    try {
      await ApiService.createCertificate({
        studentId: selectedStudentId,
        certificateType: certType,
        academicYear,
        reason,
        conduct,
        extraFields: {
          generatedOn: new Date().toLocaleDateString('en-IN'),
          status: 'Original Copy Issued',
        },
      });

      alert('✅ Certificate successfully generated and recorded in the student registry!');
      setShowIssueModal(false);
      setSelectedStudentId('');
      setReason('');
      loadCertificates();
    } catch (err: any) {
      alert('Failed to issue certificate: ' + err.message);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!confirm('Are you sure you want to revoke/delete this certificate?')) return;
    try {
      await ApiService.deleteCertificate(id);
      loadCertificates();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleOpenPrint = async (certId: string) => {
    try {
      const res = await ApiService.getCertificateDetail(certId);
      if (res.certificate) {
        setPrintCert(res.certificate);
      }
    } catch (err: any) {
      alert('Error fetching certificate print layout: ' + err.message);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    const matchesSearch =
      search === '' ||
      c.certificateNo?.toLowerCase().includes(search.toLowerCase()) ||
      c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      c.admissionNo?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || c.certificateType === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeName = (type: string) => {
    switch (type) {
      case 'TRANSFER_CERTIFICATE':
        return 'Transfer Certificate (T.C.)';
      case 'BONAFIDE_CERTIFICATE':
        return 'Bonafide / Study Certificate';
      case 'CHARACTER_CERTIFICATE':
        return 'Character Certificate';
      case 'ADMIT_CARD':
        return 'Exam Admit Card / Hall Ticket';
      case 'APPRECIATION_AWARD':
        return 'Merit & Appreciation Certificate';
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'TRANSFER_CERTIFICATE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'BONAFIDE_CERTIFICATE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CHARACTER_CERTIFICATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ADMIT_CARD':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Award size={16} />
            <span>Official Institutional Documentation</span>
          </div>
          <h1 className="text-2xl font-black">Certificates & Credentials Engine</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Generate and verify CBSE-compliant Transfer Certificates (TC), Character Certificates, Bonafide Proofs, and Examination Hall Tickets with 1-click printable letterheads.
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition active:scale-95"
        >
          <Plus size={16} />
          <span>Issue New Certificate</span>
        </button>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll no, cert no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {['ALL', 'TRANSFER_CERTIFICATE', 'BONAFIDE_CERTIFICATE', 'CHARACTER_CERTIFICATE', 'ADMIT_CARD'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                filterType === t
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Credentials' : t.replace('_CERTIFICATE', '').replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Certificates List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">
            Loading institutional certificate registry...
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <FileText size={36} className="mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-bold text-slate-600">No certificates matching criteria</p>
            <p className="text-xs text-slate-400">Issue a Transfer Certificate or Hall Ticket using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Cert Number</th>
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4">Certificate Type</th>
                  <th className="py-3 px-4">Academic Session</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Conduct / Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {cert.certificateNo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{cert.studentName}</div>
                      <div className="text-[11px] text-slate-400">
                        Adm: {cert.admissionNo} • {cert.className ? `${cert.className}-${cert.sectionName}` : 'Student'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getTypeBadgeColor(cert.certificateType)}`}>
                        {getTypeName(cert.certificateType)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {cert.academicYear}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {cert.issueDate}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {cert.reason || cert.conduct || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenPrint(cert.id)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold flex items-center gap-1.5 transition"
                          title="Preview & Print Official Document"
                        >
                          <Printer size={14} />
                          <span>Print</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Revoke Certificate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ISSUE CERTIFICATE MODAL ================= */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black">Issue Student Certificate</h3>
                  <p className="text-xs text-slate-400">Generates serial-numbered institutional certificate</p>
                </div>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="p-6 space-y-4 text-xs">
              {/* Select Student */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Student *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} (Adm: {s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Certificate Type */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Certificate Type *</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="TRANSFER_CERTIFICATE">Transfer Certificate (TC - CBSE Standard)</option>
                  <option value="BONAFIDE_CERTIFICATE">Bonafide / Study Certificate</option>
                  <option value="CHARACTER_CERTIFICATE">Character Certificate</option>
                  <option value="ADMIT_CARD">Examination Admit Card / Hall Ticket</option>
                  <option value="APPRECIATION_AWARD">Merit & Appreciation Award</option>
                </select>
              </div>

              {/* Academic Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Academic Session</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Conduct Rating</label>
                  <select
                    value={conduct}
                    onChange={(e) => setConduct(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Exemplary">Exemplary</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                  </select>
                </div>
              </div>

              {/* Reason / Purpose */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Reason / Purpose of Issue</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Higher Education Admission / Parent Transfer to Bangalore / Passport Verification"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition"
                >
                  Generate & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PRINT CERTIFICATE MODAL ================= */}
      {printCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header with Print Action */}
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider">Document Preview: {printCert.certificateNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Printer size={14} />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintCert(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-xl transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Letterhead Certificate Sheet */}
            <div className="p-8 sm:p-12 border-8 border-double border-slate-300 relative bg-amber-50/20 font-serif text-slate-800">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                <SchoolIcon size={340} />
              </div>

              {/* School Header */}
              <div className="text-center pb-6 border-b-2 border-slate-800/80 space-y-1">
                {printCert.school?.logoUrl && (
                  <img src={printCert.school.logoUrl} alt="Logo" className="w-16 h-16 mx-auto object-contain mb-1" />
                )}
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  {printCert.school?.name || 'DELHI PUBLIC SCHOOL'}
                </h1>
                <p className="text-xs text-slate-600 font-sans">
                  {printCert.school?.address || 'Sector 12, RK Puram, New Delhi'} • Phone: {printCert.school?.phone || '+91 11 4911 5500'}
                </p>
                <p className="text-[11px] text-slate-500 font-sans font-bold">
                  Affiliation No: {printCert.school?.affiliationNo || 'CBSE/AFF/2026/8892'}
                </p>
              </div>

              {/* Certificate Title Badge */}
              <div className="text-center my-6">
                <span className="inline-block px-6 py-2 bg-slate-900 text-white font-sans font-black text-sm uppercase tracking-widest rounded-full shadow">
                  {getTypeName(printCert.certificateType)}
                </span>
                <div className="flex justify-between text-xs text-slate-600 font-sans mt-3 px-2">
                  <span><strong>Certificate No:</strong> {printCert.certificateNo}</span>
                  <span><strong>Date of Issue:</strong> {printCert.issueDate}</span>
                </div>
              </div>

              {/* Certificate Body Paragraph */}
              <div className="text-justify leading-relaxed text-sm my-8 space-y-4 px-2">
                <p>
                  This is to officially certify that Master / Miss{' '}
                  <span className="font-bold underline decoration-dotted uppercase px-1 text-slate-950">
                    {printCert.student?.fullName || printCert.studentName || '—'}
                  </span>
                  , Son/Daughter of{' '}
                  <span className="font-bold underline decoration-dotted px-1">
                    {printCert.student?.fatherName || 'Mr. Manoj Sharma'}
                  </span>
                  , holding Admission Roll No.{' '}
                  <span className="font-bold font-mono px-1">
                    {printCert.student?.admissionNo || 'DPS/2026/1001'}
                  </span>{' '}
                  was a bonafide student of this institution during the academic session{' '}
                  <span className="font-bold font-mono">{printCert.academicYear}</span>, enrolled in{' '}
                  <span className="font-bold">{printCert.student?.className || 'Class 10'} - {printCert.student?.sectionName || 'A'}</span>.
                </p>

                {printCert.certificateType === 'TRANSFER_CERTIFICATE' && (
                  <p>
                    All institutional dues, library books, and examination fees have been fully cleared up to the date of leaving. 
                    The reason for leaving the institution is recorded as:{' '}
                    <span className="italic font-bold">"{printCert.reason || 'Parent relocation / Higher education'}"</span>.
                  </p>
                )}

                {printCert.certificateType === 'BONAFIDE_CERTIFICATE' && (
                  <p>
                    This bonafide certificate is issued upon the request of the student/parent for the specified purpose of:{' '}
                    <span className="italic font-bold">"{printCert.reason || 'Verification & Official Documentation'}"</span>.
                  </p>
                )}

                {printCert.certificateType === 'ADMIT_CARD' && (
                  <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl font-sans text-xs space-y-2">
                    <div className="font-bold text-slate-800">Exam Hall Ticket & Schedule:</div>
                    <div>Exam: {printCert.extra?.examName || 'Mid-Term Examination'}</div>
                    <div>Center: {printCert.extra?.examCenter || 'Main Academic Wing'}</div>
                    <div className="text-[11px] text-slate-500">Student is authorized to appear with this admit card and official student ID card.</div>
                  </div>
                )}

                <p>
                  During the period of study, the student’s general conduct, discipline, and character were found to be{' '}
                  <span className="font-bold uppercase tracking-wider">{printCert.conduct || 'Exemplary'}</span>. 
                  We wish them every success in their future academic pursuits.
                </p>
              </div>

              {/* Signatures Footer */}
              <div className="mt-16 pt-8 grid grid-cols-3 text-center text-xs font-sans font-bold text-slate-700">
                <div>
                  <div className="h-10 border-b border-slate-400 mx-6 mb-1"></div>
                  <span>Prepared By</span>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 mx-6 mb-1 flex items-end justify-center">
                    <span className="text-[10px] text-slate-400 font-mono">[INSTITUTIONAL SEAL]</span>
                  </div>
                  <span>Registrar / Exam Incharge</span>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 mx-6 mb-1 flex items-end justify-center">
                    <span className="font-serif italic font-bold text-blue-900 text-sm">
                      {printCert.school?.principalName || 'Dr. Rajesh Khanna'}
                    </span>
                  </div>
                  <span>Principal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
