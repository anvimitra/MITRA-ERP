import React from 'react';
import { ReportCardData } from '../types';
import { Award, CheckCircle2, Calendar, User, QrCode } from 'lucide-react';

export const ModernGradientTemplate: React.FC<{ data: ReportCardData }> = ({ data }) => {
  const { school, student, exam, subjects, summary } = data;

  return (
    <div className="report-card-container bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-w-4xl mx-auto my-6 font-sans">
      {/* Header with vibrant branding */}
      <div 
        className="p-8 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${school.primaryColor || '#1e40af'} 0%, #0f172a 100%)`
        }}
      >
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-8 -translate-y-8">
          <Award size={220} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {school.logoUrl && (
              <img 
                src={school.logoUrl} 
                alt="Logo" 
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-xl bg-white"
              />
            )}
            <div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white/90 backdrop-blur mb-1">
                AFFILIATED SENIOR SECONDARY SCHOOL • CODE: {school.code}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{school.name}</h1>
              <p className="text-xs text-white/80 mt-1">{school.address} • Phone: {school.phone}</p>
            </div>
          </div>

          <div className="text-center sm:text-right bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <span className="text-[11px] uppercase tracking-wider text-white/80 font-bold block">Evaluation Report</span>
            <span className="text-lg font-black text-white">{exam.name}</span>
            <div className="text-xs text-white/70 mt-0.5">Session: {exam.academicYear}</div>
          </div>
        </div>
      </div>

      {/* Student Profile Ribbon */}
      <div className="bg-slate-50 border-b border-slate-200 px-8 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Student Name</span>
            <span className="font-bold text-slate-800 text-sm">{student.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Class & Section</span>
            <span className="font-bold text-slate-800 text-sm">{student.className} - {student.sectionName}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Admission No / Roll</span>
            <span className="font-bold text-slate-800 text-sm">{student.admissionNo} (Roll #{student.rollNo || '1'})</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Father's Name</span>
            <span className="font-bold text-slate-800 text-sm">{student.fatherName || 'Guardian'}</span>
          </div>
        </div>
      </div>

      {/* Subject Performance Matrix */}
      <div className="p-8 space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-blue-600" /> Academic Subject Performance
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Max Marks</th>
                  <th className="py-3 px-4 text-center">Marks Obtained</th>
                  <th className="py-3 px-4">Performance Bar</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {sub.subjectName}
                      {sub.subjectCode && <span className="text-[10px] text-slate-400 block font-normal">{sub.subjectCode}</span>}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">{sub.maxMarks}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{sub.marksObtained}</td>
                    <td className="py-3 px-4 w-40">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500" 
                          style={{ width: `${Math.min(100, sub.percentage)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{sub.percentage}%</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        {sub.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic text-[11px]">{sub.remarks || 'Good'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aggregate Summary Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-center">
            <span className="text-[11px] text-blue-600 font-bold uppercase block">Grand Total</span>
            <span className="text-2xl font-black text-blue-900 mt-1 block">
              {summary.totalMarksObtained} <span className="text-xs font-normal text-slate-500">/ {summary.totalMaxMarks}</span>
            </span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-center">
            <span className="text-[11px] text-emerald-600 font-bold uppercase block">Overall Percentage</span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">{summary.overallPercentage}%</span>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-center">
            <span className="text-[11px] text-indigo-600 font-bold uppercase block">Final Grade</span>
            <span className="text-2xl font-black text-indigo-900 mt-1 block">{summary.overallGrade}</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-center">
            <span className="text-[11px] text-amber-600 font-bold uppercase block">Term Attendance</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">{summary.attendancePercentage}%</span>
          </div>
        </div>

        {/* Division & Remarks */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-700">Result Standing: </span>
            <span className="font-black text-emerald-700">{summary.division}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-slate-500">{summary.overallRemarks}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <QrCode size={20} className="text-slate-600" />
            <span>Digital Verified by ANVIMITRA-ERP</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-600">
          <div className="border-t border-slate-300 pt-2">
            <span className="font-semibold block">Class Teacher</span>
            <span className="text-[10px] text-slate-400">Verified</span>
          </div>
          <div className="border-t border-slate-300 pt-2">
            <span className="font-semibold block">Examination Incharge</span>
            <span className="text-[10px] text-slate-400">Approved</span>
          </div>
          <div className="border-t border-slate-300 pt-2">
            <span className="font-semibold block">Principal</span>
            <span className="text-[10px] text-slate-400">Delhi Public Global Academy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
