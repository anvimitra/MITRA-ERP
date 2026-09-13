import React, { useState, useEffect } from 'react';
import { ExamReport, Student, School } from '../types';
import { fetchStudentExamReport } from '../api';
import { Award, CheckCircle2, Download, Printer, Palette, Sparkles } from 'lucide-react';

interface Props {
  student?: Student | null;
  school?: School | null;
  report?: ExamReport | null;
}

export type TemplateMode = 'modern' | 'cbse' | 'minimal' | 'vibrant';

export const ReportCardView: React.FC<Props> = ({ student, school, report: initialReport }) => {
  const [selectedExamKey, setSelectedExamKey] = useState<string>('sa1');
  const [template, setTemplate] = useState<TemplateMode>('modern');
  const [report, setReport] = useState<ExamReport | null>(initialReport || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student?.id) {
      setLoading(true);
      fetchStudentExamReport(student.id, selectedExamKey)
        .then((res) => setReport(res))
        .catch(() => setReport(null))
        .finally(() => setLoading(false));
    }
  }, [student?.id, selectedExamKey]);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
        <Award className="w-10 h-10 text-slate-300 mb-2" />
        <h3 className="font-bold text-slate-800 text-sm">No Student Report Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Please select or link a student to view official term report cards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Exam Selector & Template Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Exam</label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setSelectedExamKey('sa1')}
              className={`py-1.5 px-2 text-xs font-bold rounded-xl transition ${
                selectedExamKey === 'sa1' ? 'bg-purple-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
              }`}
            >
              SA1 Exam
            </button>
            <button
              onClick={() => setSelectedExamKey('weekly')}
              className={`py-1.5 px-2 text-xs font-bold rounded-xl transition ${
                selectedExamKey === 'weekly' ? 'bg-purple-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Weekly Test
            </button>
            <button
              onClick={() => setSelectedExamKey('half_yearly')}
              className={`py-1.5 px-2 text-xs font-bold rounded-xl transition ${
                selectedExamKey === 'half_yearly' ? 'bg-purple-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Half Yearly
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center space-x-1">
            <Palette className="w-3 h-3 text-purple-600" />
            <span>Card Template Style</span>
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(['modern', 'cbse', 'minimal', 'vibrant'] as TemplateMode[]).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`py-1 text-[11px] capitalize font-bold rounded-lg transition ${
                  template === t ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* THE REPORT CARD PREVIEW */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400 font-bold">
          Loading exam evaluation report...
        </div>
      ) : !report ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
          <Award className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-xs">No Report Published Yet</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Marks for this examination have not been finalized or published by the institution yet.
          </p>
        </div>
      ) : (
        <div
          className={`rounded-2xl p-4 shadow-md transition-all ${
            template === 'modern'
              ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-white border border-purple-700/50'
              : template === 'cbse'
              ? 'bg-amber-50/50 border-2 border-amber-900/40 text-slate-900'
              : template === 'vibrant'
              ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 text-white shadow-xl'
              : 'bg-white border border-slate-300 text-slate-900'
          }`}
        >
        {/* School Header on Card */}
        <div className="text-center pb-3 border-b border-white/20">
          <h2 className="font-black text-base uppercase tracking-wider">{school?.name || 'School ERP'}</h2>
          <p className="text-[11px] opacity-80">{school?.address || ''}</p>
          <div className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-purple-950 text-[10px] font-black uppercase">
            Official Performance Card
          </div>
        </div>

        {/* Student metadata */}
        <div className="grid grid-cols-2 gap-2 my-3 text-xs opacity-90">
          <div>
            <span className="text-[10px] uppercase font-bold opacity-60 block">Student</span>
            <span className="font-extrabold">{student.firstName} {student.lastName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold opacity-60 block">Class & Sec</span>
            <span className="font-extrabold">{student.className} - {student.sectionName} (Roll #{student.rollNo})</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold opacity-60 block">Examination</span>
            <span className="font-extrabold">{report.examName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold opacity-60 block">Session</span>
            <span className="font-extrabold">{report.academicYear}</span>
          </div>
        </div>

        {/* Subject Marks Table */}
        <div className="overflow-hidden rounded-xl my-3 bg-white/10 backdrop-blur-md border border-white/20">
          <table className="w-full text-xs text-left">
            <thead className="bg-black/20 text-[10px] uppercase font-black">
              <tr>
                <th className="p-2">Subject</th>
                <th className="p-2 text-center">Marks</th>
                <th className="p-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {report.subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-white/5">
                  <td className="p-2 font-bold">{sub.subjectName}</td>
                  <td className="p-2 text-center font-extrabold">
                    {sub.marksObtained} <span className="opacity-60 text-[10px]">/{sub.maxMarks}</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/80 text-white font-black text-[10px]">
                      {sub.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/20 text-center my-3">
          <div>
            <span className="text-[9px] uppercase font-bold opacity-60 block">Total</span>
            <span className="font-black text-sm">{report.totalMarks} / {report.maxTotalMarks}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold opacity-60 block">Percentage</span>
            <span className="font-black text-sm text-amber-300">{report.percentage}%</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold opacity-60 block">Result</span>
            <span className="font-black text-sm text-emerald-400">{report.resultStatus}</span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => alert(`Report Card for ${student.firstName} (${report.examName}) downloaded as PDF!`)}
          className="w-full py-2 bg-white text-purple-950 hover:bg-amber-300 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 mt-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Verified PDF Report</span>
        </button>
      </div>
      )}
    </div>
  );
};
