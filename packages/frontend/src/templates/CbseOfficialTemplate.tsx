import React from 'react';
import { ReportCardData } from '../types';

export const CbseOfficialTemplate: React.FC<{ data: ReportCardData }> = ({ data }) => {
  const { school, student, exam, subjects, summary } = data;

  return (
    <div className="report-card-container bg-white text-slate-900 border-4 border-double border-slate-800 p-8 max-w-4xl mx-auto my-6 font-serif shadow-xl">
      {/* Header */}
      <div className="text-center border-b-2 border-slate-800 pb-4 relative">
        <div className="flex items-center justify-between">
          {school.logoUrl && (
            <img src={school.logoUrl} alt="Logo" className="w-16 h-16 object-contain grayscale" />
          )}
          <div className="flex-1 px-4">
            <span className="text-[11px] font-sans uppercase tracking-widest text-slate-600 block">
              CENTRAL BOARD OF SECONDARY EDUCATION, NEW DELHI
            </span>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-950 font-serif">
              {school.name}
            </h1>
            <p className="text-xs text-slate-600 font-sans mt-0.5">{school.address}</p>
            <div className="flex justify-center gap-6 text-[10px] text-slate-500 font-sans mt-1">
              <span>Affiliation No: 2130099</span>
              <span>School Code: {school.code}</span>
              <span>Session: {exam.academicYear}</span>
            </div>
          </div>
          <div className="w-16 h-16 border border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-400 font-sans">
            Student Photo
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-slate-300">
          <span className="inline-block bg-slate-900 text-white font-sans text-xs px-4 py-1 uppercase tracking-widest font-bold">
            ACADEMIC PERFORMANCE REPORT CARD • {exam.name}
          </span>
        </div>
      </div>

      {/* Student Details Grid */}
      <div className="my-4 border border-slate-400 p-3 bg-slate-50/50 text-xs font-sans">
        <div className="grid grid-cols-2 gap-y-2">
          <div><span className="text-slate-500">Student's Name:</span> <strong className="text-slate-900 uppercase">{student.name}</strong></div>
          <div><span className="text-slate-500">Class & Section:</span> <strong>{student.className} - {student.sectionName}</strong></div>
          <div><span className="text-slate-500">Roll No:</span> <strong>{student.rollNo || '1'}</strong></div>
          <div><span className="text-slate-500">Admission No:</span> <strong>{student.admissionNo}</strong></div>
          <div><span className="text-slate-500">Father's Name:</span> <strong>{student.fatherName || 'Mr. Guardian'}</strong></div>
          <div><span className="text-slate-500">Mother's Name:</span> <strong>{student.motherName || 'Mrs. Guardian'}</strong></div>
          <div><span className="text-slate-500">Date of Birth:</span> <strong>{student.dob || '15/04/2011'}</strong></div>
          <div><span className="text-slate-500">Attendance:</span> <strong>{summary.presentDays} / {summary.totalWorkingDays} ({summary.attendancePercentage}%)</strong></div>
        </div>
      </div>

      {/* Part 1: Scholastic Areas */}
      <div className="my-4">
        <div className="bg-slate-800 text-white text-[11px] font-sans font-bold px-3 py-1 uppercase tracking-wide">
          PART 1: SCHOLASTIC AREAS
        </div>
        <table className="w-full text-left text-xs border-collapse border border-slate-400 font-sans">
          <thead>
            <tr className="bg-slate-100 text-slate-800 text-center font-bold">
              <th className="border border-slate-400 py-2 px-3 text-left">Subject Code & Name</th>
              <th className="border border-slate-400 py-2 px-2">Max Marks</th>
              <th className="border border-slate-400 py-2 px-2">Periodic Test (WT)</th>
              <th className="border border-slate-400 py-2 px-2">Exam Marks</th>
              <th className="border border-slate-400 py-2 px-2">Total Marks</th>
              <th className="border border-slate-400 py-2 px-2">Grade</th>
              <th className="border border-slate-400 py-2 px-2">Grade Point</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, idx) => {
              const periodic = Math.round(s.marksObtained * 0.2);
              const mainExam = Math.round(s.marksObtained * 0.8);
              return (
                <tr key={idx} className="text-center">
                  <td className="border border-slate-400 py-2 px-3 text-left font-semibold">
                    {s.subjectCode || `SUB0${idx + 1}`} - {s.subjectName}
                  </td>
                  <td className="border border-slate-400 py-2 px-2">{s.maxMarks}</td>
                  <td className="border border-slate-400 py-2 px-2 text-slate-600">{periodic}</td>
                  <td className="border border-slate-400 py-2 px-2 text-slate-600">{mainExam}</td>
                  <td className="border border-slate-400 py-2 px-2 font-bold">{s.marksObtained}</td>
                  <td className="border border-slate-400 py-2 px-2 font-black">{s.grade}</td>
                  <td className="border border-slate-400 py-2 px-2">{s.gradePoint.toFixed(1)}</td>
                </tr>
              );
            })}
            <tr className="bg-slate-100 font-bold text-center">
              <td className="border border-slate-400 py-2 px-3 text-left uppercase">Grand Aggregate</td>
              <td className="border border-slate-400 py-2 px-2">{summary.totalMaxMarks}</td>
              <td className="border border-slate-400 py-2 px-2" colSpan={2}>Percentage: {summary.overallPercentage}%</td>
              <td className="border border-slate-400 py-2 px-2 text-blue-900 font-black">{summary.totalMarksObtained}</td>
              <td className="border border-slate-400 py-2 px-2 font-black">{summary.overallGrade}</td>
              <td className="border border-slate-400 py-2 px-2">{summary.overallGradePoint.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Part 2: Co-Scholastic Activities */}
      <div className="my-4">
        <div className="bg-slate-800 text-white text-[11px] font-sans font-bold px-3 py-1 uppercase tracking-wide">
          PART 2: CO-SCHOLASTIC ACTIVITIES (3-Point Grading Scale: A, B, C)
        </div>
        <table className="w-full text-left text-xs border-collapse border border-slate-400 font-sans">
          <thead>
            <tr className="bg-slate-100 text-slate-800 text-center font-bold">
              <th className="border border-slate-400 py-1.5 px-3 text-left">Activity Area</th>
              <th className="border border-slate-400 py-1.5 px-2 w-24">Grade</th>
              <th className="border border-slate-400 py-1.5 px-3 text-left">Descriptive Indicators</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-400 py-1.5 px-3 font-semibold">Work Education</td>
              <td className="border border-slate-400 py-1.5 px-2 text-center font-bold">A</td>
              <td className="border border-slate-400 py-1.5 px-3 text-slate-600">Demonstrates keen curiosity, completes projects diligently.</td>
            </tr>
            <tr>
              <td className="border border-slate-400 py-1.5 px-3 font-semibold">Art & Cultural Education</td>
              <td className="border border-slate-400 py-1.5 px-2 text-center font-bold">A</td>
              <td className="border border-slate-400 py-1.5 px-3 text-slate-600">Creative expression, enthusiastic participant in stage events.</td>
            </tr>
            <tr>
              <td className="border border-slate-400 py-1.5 px-3 font-semibold">Health & Physical Education</td>
              <td className="border border-slate-400 py-1.5 px-2 text-center font-bold">A</td>
              <td className="border border-slate-400 py-1.5 px-3 text-slate-600">Active sportsmanship, regular fitness drill participation.</td>
            </tr>
            <tr>
              <td className="border border-slate-400 py-1.5 px-3 font-semibold">Discipline & Value Systems</td>
              <td className="border border-slate-400 py-1.5 px-2 text-center font-bold">A</td>
              <td className="border border-slate-400 py-1.5 px-3 text-slate-600">Courteous, punctual, shows high respect to peers and faculty.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Remarks & Grading Scale */}
      <div className="grid grid-cols-2 gap-4 my-4 font-sans text-xs">
        <div className="border border-slate-400 p-3 bg-slate-50">
          <span className="font-bold block text-slate-700 uppercase text-[10px] mb-1">Class Teacher Remarks:</span>
          <p className="italic text-slate-800 font-serif text-sm">
            "{summary.overallRemarks}. {student.name} is an attentive and hardworking student with strong analytical potential."
          </p>
          <div className="mt-2 text-[10px] text-slate-600">
            <strong>Result Status: </strong> 
            <span className="text-emerald-800 font-bold uppercase">{summary.division}</span>
          </div>
        </div>

        <div className="border border-slate-400 p-3 text-[10px] text-slate-600">
          <span className="font-bold block text-slate-800 uppercase mb-1">CBSE 9-Point Scale:</span>
          <div className="grid grid-cols-3 gap-1">
            <span>A1 (91-100)</span>
            <span>A2 (81-90)</span>
            <span>B1 (71-80)</span>
            <span>B2 (61-70)</span>
            <span>C1 (51-60)</span>
            <span>C2 (41-50)</span>
            <span>D (33-40)</span>
            <span>E (Needs Repeat)</span>
          </div>
        </div>
      </div>

      {/* Signature Row */}
      <div className="mt-8 pt-8 grid grid-cols-3 gap-4 text-center font-sans text-xs border-t border-slate-400">
        <div>
          <div className="h-8"></div>
          <strong className="block border-t border-slate-400 pt-1">Class Teacher</strong>
        </div>
        <div>
          <div className="h-8"></div>
          <strong className="block border-t border-slate-400 pt-1">Exam Coordinator</strong>
        </div>
        <div>
          <div className="h-8"></div>
          <strong className="block border-t border-slate-400 pt-1">Principal / Head of Institution</strong>
        </div>
      </div>
    </div>
  );
};
