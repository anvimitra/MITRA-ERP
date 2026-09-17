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
  School as SchoolIcon,
  Star,
  Trophy,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface CertificatesDeskProps {
  students?: Student[];
  schoolInfo?: any;
  onStudentsUpdated?: () => void;
}

export type TemplateStyle = 'classic' | 'modern' | 'heritage' | 'sports' | 'merit';

const TEMPLATES: { id: TemplateStyle; name: string; tag: string; icon: any; color: string; desc: string }[] = [
  {
    id: 'classic',
    name: 'Classic Royal CBSE',
    tag: 'Official Double Border',
    icon: SchoolIcon,
    color: 'from-blue-800 to-indigo-950',
    desc: 'Traditional institutional layout with rosettes, CBSE header, and formal 3-column verification.',
  },
  {
    id: 'modern',
    name: 'Modern Executive Ivory',
    tag: 'Gold Foil Minimalist',
    icon: Sparkles,
    color: 'from-slate-800 to-amber-950',
    desc: 'Clean ivory cardstock aesthetic, metallic gold hairline trim, and verification barcode motif.',
  },
  {
    id: 'heritage',
    name: 'Golden Heritage Laurels',
    tag: 'Ornate Filigree',
    icon: Award,
    color: 'from-amber-700 to-yellow-900',
    desc: 'Prestigious golden guilloche laurels, Roman typography, and royal recognition presentation.',
  },
  {
    id: 'sports',
    name: 'Sports & Athletics Champion',
    tag: 'Dynamic Crimson & Gold',
    icon: Trophy,
    color: 'from-rose-800 to-amber-700',
    desc: 'High-energy athletic laurels, tournament citation badge, and physical achievement honors.',
  },
  {
    id: 'merit',
    name: 'Academic Star of Excellence',
    tag: 'Emerald & Gold Star',
    icon: Star,
    color: 'from-emerald-800 to-teal-950',
    desc: 'Royal emerald borders, 5-star scholastic rosette, and highest distinction commendations.',
  },
];

function dateToWords(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const month = d.toLocaleString('en-IN', { month: 'long' });
    const year = d.getFullYear();

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const ordinals = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
      'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth',
      'Twentieth', 'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth', 'Twenty-Sixth', 'Twenty-Seventh',
      'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First'];

    const dayWord = ordinals[day] || `${day}th`;
    
    let yearWord = '';
    if (year >= 2000 && year < 2100) {
      const rem = year - 2000;
      if (rem === 0) yearWord = 'Two Thousand';
      else if (rem < 20) yearWord = `Two Thousand ${ones[rem]}`;
      else {
        const t = Math.floor(rem / 10);
        const o = rem % 10;
        yearWord = `Two Thousand ${tens[t]}${o ? ' ' + ones[o] : ''}`;
      }
    } else {
      yearWord = year.toString();
    }

    return `${dayWord} of ${month}, ${yearWord}`;
  } catch {
    return '';
  }
}

export const CertificatesDesk: React.FC<CertificatesDeskProps> = ({ students: propStudents, schoolInfo, onStudentsUpdated }) => {
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

  // Issue modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>('classic');
  const [certType, setCertType] = useState<string>('TRANSFER_CERTIFICATE');
  const [subTitle, setSubTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [conduct, setConduct] = useState('Exemplary');
  const [admissionDate, setAdmissionDate] = useState('2021-04-01');
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split('T')[0]);
  const [dobWords, setDobWords] = useState('');
  const [duesCleared, setDuesCleared] = useState('All School Dues, Library & Laboratory Fees Fully Cleared');
  const [achievement, setAchievement] = useState('');
  const [reason, setReason] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('Principal');
  const [preparedBy, setPreparedBy] = useState('Registrar / Exam Incharge');

  // Print & preview modal state
  const [printCert, setPrintCert] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateStyle>('classic');

  // Admit Card Generator Desk
  const [showAdmitCardDesk, setShowAdmitCardDesk] = useState(false);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [admitClassId, setAdmitClassId] = useState('');
  const [admitExamName, setAdmitExamName] = useState('Annual Board Examination 2026');
  const [admitCenterName, setAdmitCenterName] = useState('Central Examination Wing, Campus Block A');
  const [admitCenterNo, setAdmitCenterNo] = useState('8402');
  const [admitInstructions, setAdmitInstructions] = useState(
    '1. Candidate must carry this printed Admit Card and original Student ID Card.\n2. Reporting time is 30 minutes prior to exam schedule.\n3. Electronic devices and calculators are strictly prohibited inside the examination room.'
  );
  const [generatingAdmitCards, setGeneratingAdmitCards] = useState(false);

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
    ApiService.getClasses().then(res => {
      setClassesList(res.classes || []);
      if (res.classes?.length > 0) {
        setAdmitClassId(res.classes[0].id);
      }
    }).catch(() => {});
  }, []);

  const handleSelectStudent = (sId: string) => {
    setSelectedStudentId(sId);
    const stud = students.find(s => s.id === sId);
    if (stud) {
      if (stud.dob) {
        setDobWords(dateToWords(stud.dob));
      }
    }
  };

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
          template: templateStyle,
          subTitle,
          admissionDate,
          leavingDate,
          dobWords,
          duesCleared,
          achievement,
          signatoryTitle,
          preparedBy,
          generatedOn: new Date().toLocaleDateString('en-IN'),
          status: 'Original Copy Issued',
        },
      });

      if (certType === 'TRANSFER_CERTIFICATE') {
        alert('✅ Transfer Certificate issued! Student has been automatically updated in active institutional records.');
        const sRes = await ApiService.getStudents().catch(() => ({ students: [] }));
        setInternalStudents(sRes.students || []);
        onStudentsUpdated?.();
      } else {
        alert('✅ Certificate successfully generated and recorded in the student registry!');
      }

      setShowIssueModal(false);
      setSelectedStudentId('');
      setSubTitle('');
      setAchievement('');
      setReason('');
      loadCertificates();
    } catch (err: any) {
      alert('Failed to issue certificate: ' + err.message);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!confirm('Are you sure you want to revoke/delete this certificate from official records?')) return;
    try {
      await ApiService.deleteCertificate(id);
      loadCertificates();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleGenerateClassAdmitCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitClassId) {
      alert('Please select a target class.');
      return;
    }
    setGeneratingAdmitCards(true);
    try {
      const instructionsArr = admitInstructions
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await ApiService.generateClassAdmitCards({
        classId: admitClassId,
        examName: admitExamName,
        examCenter: admitCenterName,
        centerNo: admitCenterNo,
        instructions: instructionsArr,
      });

      alert(`🎉 Success! Generated & Assigned ${res.generatedCount} Admit Card(s) for the entire class. All students & parents can now access and print them!`);
      setShowAdmitCardDesk(false);
      loadCertificates();
    } catch (err: any) {
      alert('Error generating class admit cards: ' + err.message);
    } finally {
      setGeneratingAdmitCards(false);
    }
  };

  const handleOpenPrint = async (certId: string) => {
    try {
      const res = await ApiService.getCertificateDetail(certId);
      if (res.certificate) {
        setPrintCert(res.certificate);
        const storedTemplate = res.certificate.extra?.template as TemplateStyle;
        setPreviewTemplate(storedTemplate && TEMPLATES.some(t => t.id === storedTemplate) ? storedTemplate : 'classic');
      }
    } catch (err: any) {
      alert('Error fetching certificate print layout: ' + err.message);
    }
  };

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
      case 'MERIT_AWARD':
        return 'Certificate of Merit & Academic Distinction';
      case 'SPORTS_AWARD':
        return 'Sports & Athletic Achievement Certificate';
      case 'COMPLETION_CERTIFICATE':
        return 'Certificate of Grade / Course Completion';
      case 'EXCELLENCE_AWARD':
        return 'Star of Academic Excellence Award';
      default:
        return type.replace(/_/g, ' ');
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
      case 'SPORTS_AWARD':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'MERIT_AWARD':
      case 'APPRECIATION_AWARD':
      case 'EXCELLENCE_AWARD':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const handlePrintCertificatePdf = (cert: any, template: TemplateStyle) => {
    try {
      const typeTitle = getTypeName(cert.certificateType);
      const studentName = cert.student?.fullName || cert.studentName || `${cert.student?.firstName || ''} ${cert.student?.lastName || ''}`.trim() || 'Student';
      const fatherName = cert.student?.fatherName || 'Guardian';
      const motherName = cert.student?.motherName || 'Parent';
      const admNo = cert.student?.admissionNo || cert.admissionNo || 'N/A';
      const className = cert.student?.className || cert.className || 'Class 10';
      const sectionName = cert.student?.sectionName || cert.sectionName || 'A';
      const schoolName = cert.school?.name || schoolInfo?.name || 'Educational Institution';
      const schoolAddr = cert.school?.address || schoolInfo?.address || '';
      const schoolPhone = cert.school?.phone || schoolInfo?.phone || '';
      const schoolEmail = cert.school?.email || schoolInfo?.email || '';
      const affilNo = cert.school?.affiliationNo || schoolInfo?.affiliationNo || cert.school?.code || schoolInfo?.code || '';
      const principalName = cert.school?.principalName || schoolInfo?.principalName || 'Principal / Head of Institution';
      const logoUrl = cert.school?.logoUrl || schoolInfo?.logoUrl || '';
      const studentPhoto = cert.student?.photoUrl || cert.photoUrl || (propStudents ? propStudents.find((s) => s.id === cert.studentId)?.photoUrl : null) || '';
      const extra = cert.extra || {};
      const subTitleText = extra.subTitle || '';
      const dobWordsText = extra.dobWords || (cert.student?.dob ? dateToWords(cert.student.dob) : '');
      const duesText = extra.duesCleared || 'All Institutional & Library Dues Cleared';
      const achievementText = extra.achievement || '';
      const signatoryTitleText = extra.signatoryTitle || 'Principal';
      const preparedByText = extra.preparedBy || 'Registrar / Exam Incharge';

      let templateStyles = '';

      if (template === 'classic') {
        templateStyles = `
          .cert-container {
            border: 8px double #1e3a8a;
            padding: 32px 42px;
            background: #fffdfc;
            min-height: 960px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .cert-corner {
            position: absolute;
            width: 28px;
            height: 28px;
            border: 3px solid #b45309;
          }
          .c-tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
          .c-tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
          .c-bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
          .c-br { bottom: 6px; right: 6px; border-left: none; border-top: none; }
          .school-name { font-size: 26px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 1.5px; }
          .type-badge { display: inline-block; background: #1e3a8a; color: #ffffff; font-family: Arial, sans-serif; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 7px 28px; border-radius: 20px; }
          .underlined { font-weight: 800; border-bottom: 1.5px dotted #0f172a; padding: 0 4px; color: #000; }
        `;
      } else if (template === 'modern') {
        templateStyles = `
          .cert-container {
            border: 3px solid #0f172a;
            outline: 6px solid #ca8a04;
            outline-offset: -12px;
            padding: 36px 46px;
            background: #fdfbf7;
            min-height: 960px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .school-name { font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #0f172a; margin: 0; }
          .type-badge { display: inline-block; border-bottom: 3px solid #ca8a04; color: #0f172a; font-family: Arial, sans-serif; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; padding: 4px 16px; }
          .underlined { font-weight: 900; background: #fef08a25; border-bottom: 2px solid #ca8a04; padding: 0 6px; color: #0f172a; }
        `;
      } else if (template === 'heritage') {
        templateStyles = `
          .cert-container {
            border: 12px ridge #b45309;
            padding: 36px 44px;
            background: #fffef9;
            min-height: 960px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .school-name { font-size: 28px; font-weight: 900; color: #78350f; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
          .type-badge { display: inline-block; background: linear-gradient(135deg, #78350f, #b45309); color: #fff; font-family: Georgia, serif; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 8px 32px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }
          .underlined { font-weight: 800; border-bottom: 1px solid #b45309; padding: 0 4px; color: #451a03; font-style: italic; }
        `;
      } else if (template === 'sports') {
        templateStyles = `
          .cert-container {
            border: 8px solid #991b1b;
            outline: 3px dashed #d97706;
            outline-offset: -12px;
            padding: 36px 44px;
            background: #fffdfc;
            min-height: 960px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .school-name { font-size: 26px; font-weight: 900; color: #991b1b; margin: 0; letter-spacing: 1.5px; text-transform: uppercase; }
          .type-badge { display: inline-block; background: #991b1b; color: #ffffff; font-family: Arial, sans-serif; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2.5px; padding: 8px 28px; border-radius: 8px; border: 2px solid #d97706; }
          .underlined { font-weight: 900; border-bottom: 2px solid #991b1b; padding: 0 4px; color: #991b1b; }
        `;
      } else if (template === 'merit') {
        templateStyles = `
          .cert-container {
            border: 8px double #065f46;
            outline: 2px solid #ca8a04;
            outline-offset: -10px;
            padding: 36px 44px;
            background: #fcfdfd;
            min-height: 960px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .school-name { font-size: 28px; font-weight: 900; color: #065f46; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
          .type-badge { display: inline-block; background: #065f46; color: #ffffff; font-family: Arial, sans-serif; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 2.5px; padding: 7px 30px; border-radius: 30px; border: 2px solid #facc15; }
          .underlined { font-weight: 900; border-bottom: 2px solid #065f46; padding: 0 4px; color: #064e3b; }
        `;
      }

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${typeTitle} - ${studentName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Times New Roman', Georgia, serif;
      background: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 5px;
    }
    ${templateStyles}
    .cert-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #334155;
      padding-bottom: 14px;
      gap: 12px;
    }
    .cert-logo-box {
      width: 85px;
      text-align: left;
      flex-shrink: 0;
    }
    .cert-logo {
      max-height: 75px;
      max-width: 85px;
      object-fit: contain;
      display: block;
    }
    .cert-header-center {
      flex: 1;
      text-align: center;
    }
    .cert-photo-box {
      width: 85px;
      text-align: right;
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
    }
    .student-passport-photo {
      width: 76px;
      height: 94px;
      object-fit: cover;
      border: 2px solid #0f172a;
      padding: 1px;
      background: #ffffff;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: block;
    }
    .student-photo-placeholder {
      width: 76px;
      height: 94px;
      border: 1px dashed #64748b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      font-size: 8px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: bold;
      border-radius: 4px;
      background: #f8fafc;
    }
    .school-info {
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #475569;
      margin-top: 4px;
    }
    .affil-badge {
      font-family: Arial, sans-serif;
      font-size: 11px;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 2px;
    }
    .badge-wrap {
      text-align: center;
      margin: 22px 0 14px 0;
    }
    .cert-meta {
      display: flex;
      justify-content: space-between;
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #475569;
      margin-top: 12px;
      padding: 0 4px;
    }
    .cert-body {
      font-size: 15.5px;
      line-height: 1.85;
      text-align: justify;
      margin: 18px 0;
    }
    .citation-box {
      margin: 16px 0;
      padding: 12px 18px;
      background: #f8fafc;
      border-left: 4px solid #1e3a8a;
      font-size: 14px;
      font-family: Arial, sans-serif;
    }
    .cert-footer {
      display: flex;
      justify-content: space-between;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 11px;
      font-weight: bold;
      color: #334155;
      margin-top: 30px;
      padding-top: 15px;
    }
    .sig-col {
      width: 170px;
    }
    .sig-line {
      border-bottom: 1px solid #64748b;
      height: 38px;
      margin-bottom: 6px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .seal-text {
      font-family: monospace;
      color: #94a3b8;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="cert-container">
    ${template === 'classic' ? `
      <div class="cert-corner c-tl"></div>
      <div class="cert-corner c-tr"></div>
      <div class="cert-corner c-bl"></div>
      <div class="cert-corner c-br"></div>
    ` : ''}

    <div>
      <div class="cert-header">
        <div class="cert-logo-box">
          ${logoUrl ? `<img src="${logoUrl}" class="cert-logo" alt="Logo" />` : ''}
        </div>
        <div class="cert-header-center">
          <h1 class="school-name">${schoolName}</h1>
          <div class="school-info">${schoolAddr ? `${schoolAddr}` : ''}${schoolPhone ? ` • Phone: ${schoolPhone}` : ''}${schoolEmail ? ` • Email: ${schoolEmail}` : ''}</div>
          ${affilNo ? `<div class="affil-badge">Affiliation No: ${affilNo} • Accredited Institutional Registry</div>` : ''}
        </div>
        <div class="cert-photo-box">
          ${studentPhoto ? `
            <img src="${studentPhoto}" class="student-passport-photo" alt="Student Photo" />
          ` : `
            <div class="student-photo-placeholder">
              <span>Student</span>
              <span>Photo</span>
            </div>
          `}
        </div>
      </div>

      <div class="badge-wrap">
        <div class="type-badge">${typeTitle}</div>
        ${subTitleText ? `<div style="font-family:Georgia,serif; font-style:italic; font-size:15px; color:#475569; margin-top:6px; font-weight:bold;">"${subTitleText}"</div>` : ''}
        <div class="cert-meta">
          <div><strong>Certificate Serial No:</strong> ${cert.certificateNo}</div>
          <div><strong>Date of Issue:</strong> ${cert.issueDate || new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>

      <div class="cert-body">
        <p>
          This is to officially certify that Master / Miss <span class="underlined">${studentName}</span>,
          Son / Daughter of Shri <span class="underlined">${fatherName}</span> and Smt. <span class="underlined">${motherName}</span>,
          bearing Institutional Admission Number <span class="underlined">${admNo}</span>,
          was a regular and bonafide student of this institution during the academic session <span class="underlined">${cert.academicYear || '2026-2027'}</span>,
          enrolled in <span class="underlined">${className} - Section ${sectionName}</span>.
        </p>

        ${dobWordsText ? `
        <p>
          According to the official School Admission Register, the student's recorded Date of Birth is: <span class="underlined">${dobWordsText}</span>.
        </p>` : ''}

        ${cert.certificateType === 'TRANSFER_CERTIFICATE' ? `
        <p>
          <strong>Institutional Clearance & Dues Status:</strong> <span class="underlined">${duesText}</span>.<br />
          The reason for leaving the institution is officially recorded as: <em style="font-weight:bold;">"${cert.reason || 'Parent relocation / Higher education'}"</em>.
        </p>` : ''}

        ${cert.certificateType === 'BONAFIDE_CERTIFICATE' ? `
        <p>
          This bonafide certificate is issued upon the request of the student/parent for the specified purpose of: <em style="font-weight:bold;">"${cert.reason || 'Official Verification & Documentation'}"</em>.
        </p>` : ''}

        ${cert.certificateType === 'CHARACTER_CERTIFICATE' ? `
        <p>
          During the entire tenure of study in this institution, the student's conduct, character, discipline, and moral values have been evaluated and recorded as <span class="underlined" style="text-transform:uppercase;">${cert.conduct || 'Exemplary'}</span>.
        </p>` : ''}

        ${achievementText ? `
        <div class="citation-box">
          <strong>Special Honors & Accomplishments:</strong><br />
          ${achievementText}
        </div>` : ''}

        <p>
          During the academic tenure, the student demonstrated <span class="underlined" style="text-transform:uppercase;">${cert.conduct || 'Exemplary'}</span> character and sincere dedication. We wish the candidate all success, bright achievements, and moral fortitude in all future scholastic and life endeavors.
        </p>
      </div>
    </div>

    <div class="cert-footer">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div>${preparedByText}</div>
      </div>
      <div class="sig-col">
        <div class="sig-line seal-text">[INSTITUTIONAL SEAL]</div>
        <div>Registrar / Section Head</div>
      </div>
      <div class="sig-col">
        <div class="sig-line" style="font-family:'Times New Roman',serif; font-style:italic; font-size:15px; color:#1e3a8a;">
          ${principalName}
        </div>
        <div>${signatoryTitleText}</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank', 'width=900,height=1100');
      if (!win) {
        window.print();
      }
    } catch (err) {
      window.print();
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Award size={16} />
            <span>Official Institutional Documentation • Principal Desk Only</span>
          </div>
          <h1 className="text-2xl font-black">Certificates & Credentials Engine</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Generate and verify CBSE-compliant Transfer Certificates (TC), Bonafide Proofs, Character Certificates, and Merit Awards across 5 professional templates with instant A4 printing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAdmitCardDesk(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0 transition"
          >
            <GraduationCap size={16} />
            <span>Generate Class Admit Cards</span>
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
          >
            <Plus size={16} />
            <span>Issue Certificate / TC</span>
          </button>
        </div>
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

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'ALL', label: 'All Credentials' },
            { id: 'TRANSFER_CERTIFICATE', label: 'Transfer (T.C.)' },
            { id: 'BONAFIDE_CERTIFICATE', label: 'Bonafide' },
            { id: 'CHARACTER_CERTIFICATE', label: 'Character' },
            { id: 'MERIT_AWARD', label: 'Merit Award' },
            { id: 'SPORTS_AWARD', label: 'Sports' },
            { id: 'EXCELLENCE_AWARD', label: 'Excellence' },
            { id: 'ADMIT_CARD', label: 'Admit Card' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                filterType === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
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
            <p className="text-xs text-slate-400">Issue a Transfer Certificate, Merit Award or Hall Ticket using the button above.</p>
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
                      <div className="flex items-center gap-3">
                        {cert.photoUrl || cert.student?.photoUrl || propStudents?.find((s) => s.id === cert.studentId)?.photoUrl ? (
                          <img
                            src={cert.photoUrl || cert.student?.photoUrl || propStudents?.find((s) => s.id === cert.studentId)?.photoUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                            {cert.studentName?.charAt(0) || 'S'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800">{cert.studentName}</div>
                          <div className="text-[11px] text-slate-400">
                            Adm: {cert.admissionNo} • {cert.className ? `${cert.className}-${cert.sectionName}` : 'Student'}
                          </div>
                        </div>
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
                          <span>Preview & Print</span>
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
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black">Issue Student Certificate & Credentials</h3>
                  <p className="text-xs text-slate-400">Generates official serial-numbered institutional certificate</p>
                </div>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Select Student */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Student *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Student from School Registry --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} (Adm No: {s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Picker */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Choose Certificate Template Layout *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    const isSelected = templateStyle === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setTemplateStyle(tmpl.id)}
                        className={`cursor-pointer p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${tmpl.color} text-white`}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-[11px] leading-tight">{tmpl.name}</div>
                            <div className="text-[10px] text-blue-600 font-bold">{tmpl.tag}</div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-1">{tmpl.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Certificate Type & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Certificate Type *</label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="TRANSFER_CERTIFICATE">Transfer Certificate (T.C. - CBSE Standard)</option>
                    <option value="BONAFIDE_CERTIFICATE">Bonafide / Study Certificate</option>
                    <option value="CHARACTER_CERTIFICATE">Character Certificate</option>
                    <option value="MERIT_AWARD">Certificate of Merit & Scholastic Distinction</option>
                    <option value="SPORTS_AWARD">Sports Champion & Athletic Distinction</option>
                    <option value="COMPLETION_CERTIFICATE">Grade / Course Completion Certificate</option>
                    <option value="EXCELLENCE_AWARD">Star of Academic Excellence Award</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subtitle / Headline / Event</label>
                  <input
                    type="text"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                    placeholder="e.g. For Securing 1st Rank in Class 10 Board Examinations"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Academic Year & Conduct */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Academic Session</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Conduct & Character Rating</label>
                  <select
                    value={conduct}
                    onChange={(e) => setConduct(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Exemplary">Exemplary</option>
                    <option value="Outstanding">Outstanding</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                  </select>
                </div>
              </div>

              {/* Admission Date & Leaving Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date of Admission</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date of Leaving / Event</label>
                  <input
                    type="date"
                    value={leavingDate}
                    onChange={(e) => setLeavingDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date of Birth in Words */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Date of Birth in Words (as per Admission Register)
                </label>
                <input
                  type="text"
                  value={dobWords}
                  onChange={(e) => setDobWords(e.target.value)}
                  placeholder="e.g. Fifteenth of August, Two Thousand and Ten"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Institutional Dues Cleared Status */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Institutional Dues Status (for TC)</label>
                <select
                  value={duesCleared}
                  onChange={(e) => setDuesCleared(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="All School Dues, Library & Laboratory Fees Fully Cleared">
                    All School Dues, Library & Laboratory Fees Fully Cleared
                  </option>
                  <option value="Dues Cleared up to current academic term">
                    Dues Cleared up to current academic term
                  </option>
                  <option value="Exempted on Academic Scholarship">Exempted on Academic Scholarship</option>
                  <option value="Pending Clearance (Dues Outstanding)">Pending Clearance (Dues Outstanding)</option>
                </select>
              </div>

              {/* Special Achievements / Honors */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Special Honors, Sports Medals or Achievements</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Gold Medalist in Inter-School 200m Athletic Meet; Captain of Junior Football Squad"
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Reason / Purpose */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason / Purpose of Issue</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Higher Education Admission / Parent Transfer to Mumbai / Passport Verification"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Signatory & Prepared By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prepared / Verified By</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Signatory Title</label>
                  <input
                    type="text"
                    value={signatoryTitle}
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
                >
                  <Award size={15} />
                  <span>Generate & Register Certificate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PRINT & PREVIEW MODAL WITH TEMPLATE SWITCHER ================= */}
      {printCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header with Template Switcher & Print Action */}
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Official Document Preview: {printCert.certificateNo}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Switch template layout below and print in pristine A4 letterhead quality.
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handlePrintCertificatePdf(printCert, previewTemplate)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition"
                >
                  <Printer size={15} />
                  <span>Print A4 Certificate</span>
                </button>
                <button
                  onClick={() => setPrintCert(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-xl transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Template Selector Bar */}
            <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2 overflow-x-auto border-b border-slate-700 text-xs">
              <span className="text-slate-400 font-bold shrink-0 text-[11px]">Template:</span>
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = previewTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setPreviewTemplate(tmpl.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-md font-black'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{tmpl.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Live Preview Sheet */}
            <div className="p-6 sm:p-10 max-h-[70vh] overflow-y-auto bg-slate-100/50">
              <div
                className={`p-8 sm:p-12 relative font-serif text-slate-800 shadow-lg rounded-2xl ${
                  previewTemplate === 'classic'
                    ? 'border-8 border-double border-blue-900 bg-white'
                    : previewTemplate === 'modern'
                    ? 'border-2 border-slate-900 outline outline-4 outline-amber-500 bg-[#fdfbf7]'
                    : previewTemplate === 'heritage'
                    ? 'border-8 border-amber-700 bg-amber-50/30'
                    : previewTemplate === 'sports'
                    ? 'border-8 border-rose-900 bg-white'
                    : 'border-8 border-double border-emerald-900 bg-[#fcfdfd]'
                }`}
              >
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                  <SchoolIcon size={300} />
                </div>

                {/* School Header */}
                <div className="flex items-center justify-between pb-5 border-b-2 border-slate-800/80 gap-4">
                  <div className="w-20 shrink-0">
                    {(printCert.school?.logoUrl || schoolInfo?.logoUrl) ? (
                      <img
                        src={printCert.school?.logoUrl || schoolInfo?.logoUrl}
                        alt="Logo"
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <SchoolIcon size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center space-y-1">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                      {printCert.school?.name || schoolInfo?.name || 'Educational Institution'}
                    </h1>
                    <p className="text-xs text-slate-600 font-sans">
                      {printCert.school?.address || schoolInfo?.address || ''}
                      {(printCert.school?.phone || schoolInfo?.phone) ? ` • Phone: ${printCert.school?.phone || schoolInfo?.phone}` : ''}
                      {(printCert.school?.email || schoolInfo?.email) ? ` • Email: ${printCert.school?.email || schoolInfo?.email}` : ''}
                    </p>
                    {(printCert.school?.affiliationNo || schoolInfo?.affiliationNo || printCert.school?.code || schoolInfo?.code) && (
                      <p className="text-[11px] text-blue-800 font-sans font-bold">
                        Affiliation No: {printCert.school?.affiliationNo || schoolInfo?.affiliationNo || printCert.school?.code || schoolInfo?.code} • Accredited Registry
                      </p>
                    )}
                  </div>

                  <div className="w-20 shrink-0 flex justify-end">
                    {(printCert.student?.photoUrl || printCert.photoUrl || propStudents?.find((s) => s.id === printCert.studentId)?.photoUrl) ? (
                      <div className="w-18 h-22 border-2 border-slate-800 p-0.5 rounded shadow-sm bg-white overflow-hidden">
                        <img
                          src={printCert.student?.photoUrl || printCert.photoUrl || propStudents?.find((s) => s.id === printCert.studentId)?.photoUrl}
                          alt="Student"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-18 h-22 border border-dashed border-slate-400 rounded flex flex-col items-center justify-center text-slate-400 text-[8px] font-sans">
                        <User size={22} className="text-slate-300 mb-0.5" />
                        <span>Student Photo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate Title Badge */}
                <div className="text-center my-6">
                  <span
                    className={`inline-block px-6 py-2 font-sans font-black text-sm uppercase tracking-widest rounded-full shadow ${
                      previewTemplate === 'classic'
                        ? 'bg-blue-900 text-white'
                        : previewTemplate === 'modern'
                        ? 'bg-slate-900 text-amber-400 border border-amber-500'
                        : previewTemplate === 'heritage'
                        ? 'bg-gradient-to-r from-amber-700 to-yellow-900 text-white'
                        : previewTemplate === 'sports'
                        ? 'bg-rose-800 text-white'
                        : 'bg-emerald-900 text-white border border-yellow-400'
                    }`}
                  >
                    {getTypeName(printCert.certificateType)}
                  </span>
                  {printCert.extra?.subTitle && (
                    <div className="italic font-serif text-sm font-bold text-slate-600 mt-2">
                      "{printCert.extra.subTitle}"
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-slate-600 font-sans mt-3 px-2">
                    <span><strong>Certificate No:</strong> {printCert.certificateNo}</span>
                    <span><strong>Date of Issue:</strong> {printCert.issueDate}</span>
                  </div>
                </div>

                {/* Certificate Body Paragraph */}
                <div className="text-justify leading-relaxed text-sm my-6 space-y-4 px-2">
                  <p>
                    This is to officially certify that Master / Miss{' '}
                    <span className="font-bold underline decoration-dotted uppercase px-1 text-slate-950">
                      {printCert.student?.fullName || printCert.studentName || 'Student'}
                    </span>
                    , Son/Daughter of Shri{' '}
                    <span className="font-bold underline decoration-dotted px-1">
                      {printCert.student?.fatherName || 'Guardian'}
                    </span>{' '}
                    and Smt.{' '}
                    <span className="font-bold underline decoration-dotted px-1">
                      {printCert.student?.motherName || 'Parent'}
                    </span>
                    , holding Admission Number{' '}
                    <span className="font-bold font-mono px-1">
                      {printCert.student?.admissionNo || printCert.admissionNo || 'N/A'}
                    </span>{' '}
                    was a bonafide student of this institution during the academic session{' '}
                    <span className="font-bold font-mono">{printCert.academicYear || '2026-2027'}</span>, enrolled in{' '}
                    <span className="font-bold">{printCert.student?.className || 'Class 10'} - {printCert.student?.sectionName || 'A'}</span>.
                  </p>

                  {printCert.extra?.dobWords && (
                    <p>
                      According to the official admission register, the date of birth is:{' '}
                      <span className="font-bold italic underline decoration-dotted">{printCert.extra.dobWords}</span>.
                    </p>
                  )}

                  {printCert.certificateType === 'TRANSFER_CERTIFICATE' && (
                    <p>
                      <strong>Clearance & Dues:</strong> {printCert.extra?.duesCleared || 'All institutional dues, library books, and examination fees have been fully cleared'}.<br />
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

                  {printCert.extra?.achievement && (
                    <div className="p-3 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl font-sans text-xs">
                      <strong>Special Honors & Accomplishments:</strong><br />
                      {printCert.extra.achievement}
                    </div>
                  )}

                  <p>
                    During the period of study, the student’s general conduct, discipline, and character were found to be{' '}
                    <span className="font-bold uppercase tracking-wider">{printCert.conduct || 'Exemplary'}</span>. 
                    We wish them every success in their future scholastic and personal pursuits.
                  </p>
                </div>

                {/* Signatures Footer */}
                <div className="mt-12 pt-6 grid grid-cols-3 text-center text-xs font-sans font-bold text-slate-700">
                  <div>
                    <div className="h-8 border-b border-slate-400 mx-6 mb-1"></div>
                    <span>{printCert.extra?.preparedBy || 'Prepared By'}</span>
                  </div>
                  <div>
                    <div className="h-8 border-b border-slate-400 mx-6 mb-1 flex items-end justify-center">
                      <span className="text-[10px] text-slate-400 font-mono">[INSTITUTIONAL SEAL]</span>
                    </div>
                    <span>Registrar / Exam Incharge</span>
                  </div>
                  <div>
                    <div className="h-8 border-b border-slate-400 mx-6 mb-1 flex items-end justify-center">
                      <span className="font-serif italic font-bold text-blue-900 text-sm">
                        {printCert.school?.principalName || schoolInfo?.principalName || 'Authorized Signatory'}
                      </span>
                    </div>
                    <span>{printCert.extra?.signatoryTitle || 'Principal'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLASS ADMIT CARD GENERATOR ================= */}
      {showAdmitCardDesk && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 relative my-8">
            <button
              onClick={() => setShowAdmitCardDesk(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Class Admit Card Auto-Generator</h3>
                <p className="text-xs text-slate-500">Assign & generate exam admit cards for an entire class batch.</p>
              </div>
            </div>

            <form onSubmit={handleGenerateClassAdmitCards} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Target Class Batch *</label>
                <select
                  value={admitClassId}
                  onChange={(e) => setAdmitClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Examination Title *</label>
                <input
                  type="text"
                  required
                  value={admitExamName}
                  onChange={(e) => setAdmitExamName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. CBSE Annual Board Examination 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Examination Center Name *</label>
                  <input
                    type="text"
                    required
                    value={admitCenterName}
                    onChange={(e) => setAdmitCenterName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Center Code / Number *</label>
                  <input
                    type="text"
                    required
                    value={admitCenterNo}
                    onChange={(e) => setAdmitCenterNo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Candidate Instructions (one rule per line)</label>
                <textarea
                  rows={4}
                  value={admitInstructions}
                  onChange={(e) => setAdmitInstructions(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                <strong>🔒 Principal Authorization:</strong> Once generated, all enrolled students in this class will receive their official hall tickets and exam schedule.
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitCardDesk(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingAdmitCards}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  {generatingAdmitCards ? 'Assigning...' : '🚀 Generate Entire Class Admit Cards'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
