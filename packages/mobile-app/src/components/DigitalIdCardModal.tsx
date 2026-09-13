import React from 'react';
import { Student, School } from '../types';
import { X, Printer, ShieldCheck, QrCode, Phone, Droplet, User, School as SchoolIcon } from 'lucide-react';

interface Props {
  student: Student;
  school?: School | null;
  onClose: () => void;
}

export const DigitalIdCardModal: React.FC<Props> = ({ student, school, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Header bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-wide">Digital Student ID Card</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-4 bg-slate-100 flex flex-col items-center">
          {/* Card Frame */}
          <div
            id="mobile-student-id-card"
            className="w-full bg-white rounded-2xl border-2 border-indigo-200 shadow-md overflow-hidden flex flex-col text-slate-900"
          >
            {/* Top School Band */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-3 text-center relative">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white">
                  <SchoolIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs leading-tight tracking-tight">{school?.name || 'School ERP'}</h4>
                  <span className="text-[9px] text-purple-200 font-semibold tracking-wider uppercase">
                    Affiliated to CBSE {school?.code ? `• ${school.code}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Photo & Basic Details */}
            <div className="p-4 flex flex-col items-center text-center">
              <div className="relative mb-2">
                <img
                  src={student.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt={student.firstName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-600 shadow-sm"
                />
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-purple-700 text-white text-[9px] font-black px-2 py-0.2 rounded-full shadow">
                  STUDENT
                </span>
              </div>

              <h3 className="font-black text-sm text-slate-900 mt-1">
                {student.firstName} {student.lastName}
              </h3>
              <p className="text-xs font-bold text-purple-700">
                {student.className} - {student.sectionName}
              </p>

              {/* Grid Information */}
              <div className="w-full mt-3 grid grid-cols-2 gap-2 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px]">
                <div>
                  <span className="text-slate-400 block font-medium">Roll Number</span>
                  <span className="font-bold text-slate-800">#{student.rollNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Admission No</span>
                  <span className="font-bold text-slate-800">{student.admissionNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Blood Group</span>
                  <span className="font-bold text-rose-600 flex items-center space-x-0.5">
                    <Droplet className="w-2.5 h-2.5" />
                    <span>{student.bloodGroup || 'O+'}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Academic Year</span>
                  <span className="font-bold text-slate-800">2026–2027</span>
                </div>
                <div className="col-span-2 border-t border-slate-200/60 pt-1.5 mt-0.5">
                  <span className="text-slate-400 block font-medium">Parent / Emergency Contact</span>
                  <span className="font-bold text-slate-800 flex items-center space-x-1">
                    <Phone className="w-2.5 h-2.5 text-purple-600" />
                    <span>{student.parentPhone || 'N/A'}</span>
                  </span>
                </div>
              </div>

              {/* Digital Barcode */}
              <div className="w-full mt-3 p-2 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
                <div className="font-mono text-xl tracking-[0.35em] text-slate-800 font-bold scale-y-125 select-none">
                  ||||||||||||||||||||||
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-500 mt-1">
                  {(student.admissionNo || '').replace(/\//g, '')}
                </span>
              </div>
            </div>

            {/* Bottom Strip */}
            <div className="bg-slate-50 border-t border-slate-100 px-3 py-1.5 flex items-center justify-between text-[9px] text-slate-500">
              <span className="font-semibold text-emerald-600">✓ Official Verified Credential</span>
              <span>Valid till Mar 2027</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print ID Card</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
