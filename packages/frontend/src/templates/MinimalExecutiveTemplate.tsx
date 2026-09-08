import React from 'react';
import { ReportCardData } from '../types';

export const MinimalExecutiveTemplate: React.FC<{ data: ReportCardData }> = ({ data }) => {
  const { school, student, exam, subjects, summary } = data;

  return (
    <div className="report-card-container bg-white text-black p-8 max-w-4xl mx-auto my-6 font-mono text-xs border border-black shadow-md">
      {/* Top Banner */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase font-sans text-black">{school.name}</h1>
          <p className="text-[11px] text-gray-700 font-sans">{school.address} | Tel: {school.phone}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">INSTITUTION ID: {school.code} • SESSION: {exam.academicYear}</p>
        </div>
        <div className="text-right border-l border-black pl-4">
          <div className="font-bold text-sm uppercase">{exam.name}</div>
          <div className="text-[10px] text-gray-600">OFFICIAL TRANSCRIPT</div>
        </div>
      </div>

      {/* Student Meta */}
      <div className="grid grid-cols-4 gap-2 py-4 border-b border-black text-[11px]">
        <div><span className="text-gray-500 block text-[9px] uppercase">CANDIDATE</span><strong>{student.name}</strong></div>
        <div><span className="text-gray-500 block text-[9px] uppercase">CLASS/SEC</span><strong>{student.className} - {student.sectionName}</strong></div>
        <div><span className="text-gray-500 block text-[9px] uppercase">ADM NO</span><strong>{student.admissionNo}</strong></div>
        <div><span className="text-gray-500 block text-[9px] uppercase">ROLL NO</span><strong>{student.rollNo || '1'}</strong></div>
      </div>

      {/* Marks Table */}
      <div className="my-4">
        <table className="w-full text-left border-collapse border border-black text-[11px]">
          <thead>
            <tr className="border-b border-black bg-gray-100 uppercase font-sans text-[10px]">
              <th className="py-2 px-3 border-r border-black">Subject</th>
              <th className="py-2 px-2 border-r border-black text-center">Max</th>
              <th className="py-2 px-2 border-r border-black text-center">Obtained</th>
              <th className="py-2 px-2 border-r border-black text-center">%</th>
              <th className="py-2 px-2 border-r border-black text-center">Grade</th>
              <th className="py-2 px-2 border-r border-black text-center">GP</th>
              <th className="py-2 px-3">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="py-2 px-3 border-r border-black font-medium">{sub.subjectName}</td>
                <td className="py-2 px-2 border-r border-black text-center">{sub.maxMarks}</td>
                <td className="py-2 px-2 border-r border-black text-center font-bold">{sub.marksObtained}</td>
                <td className="py-2 px-2 border-r border-black text-center">{sub.percentage}%</td>
                <td className="py-2 px-2 border-r border-black text-center font-bold">{sub.grade}</td>
                <td className="py-2 px-2 border-r border-black text-center">{sub.gradePoint.toFixed(1)}</td>
                <td className="py-2 px-3 text-gray-700">{sub.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-bold bg-gray-50 font-sans">
              <td className="py-2 px-3 border-r border-black uppercase">Aggregate</td>
              <td className="py-2 px-2 border-r border-black text-center">{summary.totalMaxMarks}</td>
              <td className="py-2 px-2 border-r border-black text-center">{summary.totalMarksObtained}</td>
              <td className="py-2 px-2 border-r border-black text-center">{summary.overallPercentage}%</td>
              <td className="py-2 px-2 border-r border-black text-center">{summary.overallGrade}</td>
              <td className="py-2 px-2 border-r border-black text-center">{summary.overallGradePoint.toFixed(1)}</td>
              <td className="py-2 px-3">{summary.division}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Stat Box */}
      <div className="grid grid-cols-3 gap-3 border border-black p-3 bg-gray-50 my-4 text-[10px]">
        <div>
          <span className="text-gray-500 block uppercase">Attendance Record:</span>
          <strong>{summary.presentDays} Days Present / {summary.totalWorkingDays} Working Days ({summary.attendancePercentage}%)</strong>
        </div>
        <div>
          <span className="text-gray-500 block uppercase">Evaluation Result:</span>
          <strong className="uppercase">{summary.division}</strong>
        </div>
        <div>
          <span className="text-gray-500 block uppercase">Faculty Note:</span>
          <span>{summary.overallRemarks}</span>
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-12 grid grid-cols-2 gap-8 text-center text-[10px] font-sans">
        <div className="border-t border-black pt-1 uppercase">Authorised Evaluator Signature</div>
        <div className="border-t border-black pt-1 uppercase">Head of Institution / Stamp</div>
      </div>
    </div>
  );
};
