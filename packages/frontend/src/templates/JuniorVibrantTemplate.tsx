import React from 'react';
import { ReportCardData } from '../types';
import { Sparkles, Star, Heart, Trophy, Smile } from 'lucide-react';

export const JuniorVibrantTemplate: React.FC<{ data: ReportCardData }> = ({ data }) => {
  const { school, student, exam, subjects, summary } = data;

  return (
    <div className="report-card-container bg-gradient-to-b from-amber-50/50 via-white to-sky-50/50 text-slate-800 p-8 rounded-3xl max-w-4xl mx-auto my-6 border-4 border-dashed border-amber-300 shadow-2xl font-sans">
      {/* Playful Header */}
      <div className="text-center pb-6 border-b-2 border-amber-200 relative">
        <div className="flex justify-center items-center gap-2 mb-2">
          <span className="text-2xl animate-bounce">🎈</span>
          <span className="px-3 py-1 bg-amber-400 text-amber-950 font-black rounded-full text-xs uppercase tracking-wider shadow">
            Official Progress & Achievement Card
          </span>
          <span className="text-2xl animate-bounce">🚀</span>
        </div>

        <h1 className="text-3xl font-black text-indigo-900 tracking-tight">{school.name}</h1>
        <p className="text-xs text-indigo-600 font-medium mt-1">{school.address} • School Code: {school.code}</p>

        <div className="inline-block mt-3 px-5 py-1.5 rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-200">
          🌟 {exam.name} • Academic Year {exam.academicYear} 🌟
        </div>
      </div>

      {/* Student Badge Card */}
      <div className="my-6 bg-white rounded-2xl p-5 border-2 border-sky-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-3xl shadow-md border-2 border-white">
            🎓
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Star Student</span>
            <h2 className="text-xl font-black text-slate-900">{student.name}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold mt-0.5">
              <span>Class: {student.className} ({student.sectionName})</span>
              <span>•</span>
              <span>Roll #{student.rollNo || '1'}</span>
              <span>•</span>
              <span>Adm: {student.admissionNo}</span>
            </div>
          </div>
        </div>

        {/* Fun Badges */}
        <div className="flex gap-2">
          <div className="px-3 py-2 bg-pink-50 border border-pink-200 rounded-xl text-center">
            <span className="text-sm block">🏆</span>
            <span className="text-[10px] font-black text-pink-700">Top Learner</span>
          </div>
          <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-sm block">🎯</span>
            <span className="text-[10px] font-black text-emerald-700">{summary.attendancePercentage}% Present</span>
          </div>
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-sm block">⭐</span>
            <span className="text-[10px] font-black text-amber-700">Grade {summary.overallGrade}</span>
          </div>
        </div>
      </div>

      {/* Subjects Colorful Table */}
      <div className="my-6">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="text-amber-500" size={16} /> Learning Journey & Subject Scores
        </h3>
        <div className="rounded-2xl border-2 border-indigo-100 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-indigo-50 text-indigo-900 font-black">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-3 text-center">Marks</th>
                <th className="py-3 px-3 text-center">Rating</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-4">Teacher Smiles & Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-amber-50/30 transition">
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    {sub.subjectName}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">
                    {sub.marksObtained} <span className="text-[10px] text-slate-400 font-normal">/ {sub.maxMarks}</span>
                  </td>
                  <td className="py-3 px-3 text-center text-amber-400">
                    {'★'.repeat(sub.percentage >= 80 ? 5 : sub.percentage >= 60 ? 4 : 3)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
                      {sub.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium italic">
                    "{sub.remarks || 'Keep working hard!'}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cheerful Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-200 uppercase block">Grand Total Marks</span>
            <div className="text-3xl font-black mt-0.5">
              {summary.totalMarksObtained} <span className="text-sm font-normal text-indigo-200">/ {summary.totalMaxMarks}</span>
            </div>
            <p className="text-xs text-indigo-100 mt-1">Overall Percentage: {summary.overallPercentage}%</p>
          </div>
          <Trophy size={48} className="text-amber-300 opacity-90" />
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl flex flex-col justify-center">
          <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
            <Smile size={14} /> Teacher's Encouragement
          </span>
          <p className="text-xs text-amber-950 font-medium italic mt-1.5">
            "{summary.overallRemarks}! You have demonstrated exceptional enthusiasm in the classroom. Keep shining bright!"
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-8 pt-6 border-t-2 border-amber-200 grid grid-cols-2 gap-8 text-center text-xs">
        <div>
          <div className="h-6"></div>
          <span className="font-bold text-slate-800 block border-t-2 border-amber-300 pt-1">Class Teacher Signature</span>
          <span className="text-[10px] text-slate-400">Mrs. Sunita Sharma</span>
        </div>
        <div>
          <div className="h-6"></div>
          <span className="font-bold text-slate-800 block border-t-2 border-amber-300 pt-1">Principal Signature & School Seal</span>
          <span className="text-[10px] text-slate-400">Dr. Rajesh Khanna</span>
        </div>
      </div>
    </div>
  );
};
