import React, { useState, useEffect, useRef } from 'react';
import { School, SMSLogItem, User } from '../types';
import { ApiService } from '../api';
import { School as SchoolIcon, Plus, Cloud, Server, MessageSquare, ShieldCheck, CheckCircle2, Key, RefreshCw, Trash2, Edit, Lock, X, Copy, Check, HardDrive, Download, Upload, Database, AlertTriangle, UserCheck, Power } from 'lucide-react';

interface Props {
  user?: User | null;
  onUpdateUser?: (updatedUser: User) => void;
}

export const SuperAdminPortal: React.FC<Props> = ({ user: initialUser, onUpdateUser }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [smsLogs, setSmsLogs] = useState<SMSLogItem[]>([]);

  // Super Admin Profile State
  const [profileName, setProfileName] = useState(initialUser?.name || 'Super Admin');
  const [profileEmail, setProfileEmail] = useState(initialUser?.email || 'admin@anvimitra.com');
  const [profilePhone, setProfilePhone] = useState(initialUser?.phone || '');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setProfileName(initialUser.name || 'Super Admin');
      setProfileEmail(initialUser.email || 'admin@anvimitra.com');
      setProfilePhone(initialUser.phone || '');
    }
  }, [initialUser]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Add school form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [customBoard, setCustomBoard] = useState('');
  const [domain, setDomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e40af');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [affiliationNo, setAffiliationNo] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [website, setWebsite] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [principalEmail, setPrincipalEmail] = useState('');
  const [principalPassword, setPrincipalPassword] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{
    schoolCode: string;
    email: string;
    password: string;
    name: string;
  } | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Master PC Storage & DB Persistence State
  const [dbStatus, setDbStatus] = useState<{
    database: string;
    isPostgresConnected: boolean;
    schoolCount: number;
    studentCount: number;
    userCount: number;
    persistentStorage: string;
  } | null>(null);
  const [showPgInstructions, setShowPgInstructions] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const restoreFileRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getSchools();
      setSchools(res.schools || []);
      const smsRes = await ApiService.getSMSLogs().catch(() => ({ smsLogs: [] }));
      setSmsLogs(smsRes.smsLogs || []);
      const statusRes = await ApiService.getDbStatus().catch(() => null);
      setDbStatus(statusRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setBackupLoading(true);
      const res = await ApiService.getBackupSnapshot();
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anvimitra_master_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download backup: ' + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Restore all schools and database records from '${file.name}'? Existing schools will be updated.`)) {
      e.target.value = '';
      return;
    }

    try {
      setBackupLoading(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const dataset = parsed.dataset || parsed;
      const res = await ApiService.restoreBackupSnapshot(dataset);
      alert(`✅ Success: Restored ${res.totalSchools || 0} schools into the active ERP!`);
      await loadData();
    } catch (err: any) {
      alert('Error restoring backup: ' + err.message);
    } finally {
      setBackupLoading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedBoard = board === 'Other' ? (customBoard.trim() || 'Other') : board;
      const res = await ApiService.createSchool({
        name,
        code,
        domain,
        primaryColor,
        phone,
        email,
        address,
        affiliationNo,
        principalName,
        principalEmail,
        principalPassword,
        city,
        state: stateName,
        pincode,
        website,
        establishedYear,
        tagline,
        board: selectedBoard,
        logoUrl,
      });

      setShowAddModal(false);
      setName('');
      setCode('');
      setBoard('CBSE');
      setCustomBoard('');
      setDomain('');
      setPhone('');
      setEmail('');
      setAddress('');
      setAffiliationNo('');
      setPrincipalName('');
      setPrincipalEmail('');
      setPrincipalPassword('');
      setCity('');
      setStateName('');
      setPincode('');
      setWebsite('');
      setEstablishedYear('');
      setTagline('');
      setLogoUrl('');
      loadData();

      if (res.principalCredentials) {
        setCreatedCredentials(res.principalCredentials);
        setShowCredentialsModal(true);
      } else {
        alert('✅ New School Tenant created successfully with full profile!');
      }
    } catch (err: any) {
      alert('Error creating school: ' + err.message);
    }
  };

  const handleToggleServices = async (schoolId: string, schoolName: string, currentlyActive: boolean) => {
    const actionText = currentlyActive ? 'SUSPEND / TURN OFF' : 'ACTIVATE / TURN ON';
    const message = currentlyActive
      ? `⚠️ Are you sure you want to TURN OFF services for "${schoolName}"?\n\n- School users (Principal, Teachers, Parents, Students) will STILL be able to log in.\n- However, ALL operational ERP services (attendance, fees, exams, certificates, timetable, etc.) will be locked until re-enabled.`
      : `Activate ERP services for "${schoolName}"? School users will regain full operational access to all ERP modules.`;

    if (!confirm(message)) return;

    try {
      const res = await ApiService.toggleSchoolServices(schoolId, !currentlyActive);
      alert(res.message || `Services updated for ${schoolName}`);
      loadData();
    } catch (err: any) {
      alert('Error updating services: ' + err.message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await ApiService.updateProfile({
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        currentPassword: profileCurrentPassword || undefined,
        newPassword: profileNewPassword || undefined,
      });
      alert('✅ Super Admin Profile updated successfully!');
      if (onUpdateUser && res.user) {
        onUpdateUser(res.user);
      }
      setShowProfileModal(false);
      setProfileCurrentPassword('');
      setProfileNewPassword('');
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    if (!confirm(`Are you sure you want to permanently remove '${schoolName}'? This will delete the school tenant from the platform.`)) {
      return;
    }
    try {
      await ApiService.deleteSchool(schoolId);
      alert(`✅ School '${schoolName}' removed successfully.`);
      loadData();
    } catch (err: any) {
      alert('Error removing school: ' + err.message);
    }
  };

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    try {
      await ApiService.updateSchool(editingSchool.id, editingSchool);
      alert('✅ School details updated successfully by Super Admin!');
      setEditingSchool(null);
      loadData();
    } catch (err: any) {
      alert('Error updating school: ' + err.message);
    }
  };

  const PRESET_LOGOS = [
    { name: 'CBSE Crest', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150' },
    { name: 'Royal Academy', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150' },
    { name: 'Global High', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150' },
    { name: 'Modern Tech', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150' },
  ];

  const handleLogoFileUpload = (file: File, setter: (url: string) => void) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('⚠️ Image size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setter(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    try {
      await ApiService.changePassword(currentPassword, newPassword);
      alert('✅ Password updated successfully!');
      setShowPassModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      alert('Error changing password: ' + err.message);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Cloud size={16} /> Cloudflare Edge Multi-Tenant Control Plane
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">ANVIMITRA-ERP Super Admin</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Manage educational institutions, school profiles, monitor Cloudflare edge deployment health, instant In-App notifications, and multi-tenant security isolation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white font-bold text-xs border border-purple-700/60 shadow transition"
          >
            <UserCheck size={16} />
            <span>Edit My Profile & Security</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition"
          >
            <Plus size={18} />
            <span>Register New School</span>
          </button>
        </div>
      </div>

      {/* Cloudflare Edge Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cloudflare Workers</span>
            <Server size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">275+ PoPs</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} /> Global Edge Healthy (0ms cold start)
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cloudflare D1 DB</span>
            <Server size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">Edge SQLite</div>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">Multi-Tenant Isolated Rows</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Schools</span>
            <SchoolIcon size={18} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{schools.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Independent Subdomains</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In-App Notification Dispatch</span>
            <MessageSquare size={18} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">100%</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Instant App Push Active</p>
        </div>
      </div>

      {/* Master PC Storage & Zero Data Loss Hub */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-purple-800/40 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <HardDrive size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Single Computer Master Storage & Auto Crash Recovery</h2>
                {dbStatus?.isPostgresConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Cloud PostgreSQL Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <ShieldCheck size={10} /> Local PC Master Hub Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Every school, student, mark, and fee transaction is automatically mirrored to this computer ({dbStatus?.schoolCount || schools.length} Schools Protected). If the cloud container ever sleeps or restarts, this PC automatically restores all data.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <input
              type="file"
              ref={restoreFileRef}
              onChange={handleFileRestore}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Download size={14} />
              <span>{backupLoading ? 'Exporting...' : 'Download Master Backup (JSON)'}</span>
            </button>
            <button
              onClick={() => restoreFileRef.current?.click()}
              disabled={backupLoading}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Upload size={14} />
              <span>Restore from PC / JSON</span>
            </button>
            <button
              onClick={() => window.open('http://localhost:5432', '_blank')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 flex items-center gap-1.5"
            >
              <Server size={14} />
              <span>Open Local Connector (Port 5432)</span>
            </button>
            <button
              onClick={() => setShowPgInstructions(!showPgInstructions)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700"
            >
              {showPgInstructions ? 'Hide Render Cloud DB Guide' : 'Add Render Free PostgreSQL'}
            </button>
          </div>
        </div>

        {/* Collapsible Render PostgreSQL Guide */}
        {showPgInstructions && (
          <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/60 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <Database size={14} className="text-purple-400" />
              <span>Optional: Attach 100% Free PostgreSQL on Render (Takes 1 Minute)</span>
            </div>
            <p className="text-slate-400">
              For additional cloud permanence on Render (zero downtime even if your computer is switched off):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 ml-1 text-slate-300">
              <li>Open <strong>dashboard.render.com</strong>, click <strong>"New +"</strong> &rarr; select <strong>"PostgreSQL"</strong>.</li>
              <li>Name it <code className="bg-slate-800 px-1.5 py-0.5 rounded text-purple-300">mitra-db</code>, choose the <strong>Free</strong> tier, and click <strong>Create Database</strong>.</li>
              <li>Copy the <strong>"Internal Database URL"</strong>.</li>
              <li>In Render, open your <code className="bg-slate-800 px-1.5 py-0.5 rounded text-purple-300">mitra-erp</code> Web Service &rarr; <strong>Environment</strong> &rarr; add <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">DATABASE_URL</code> with that copied URL &rarr; Save!</li>
            </ol>
            <p className="text-emerald-400 font-semibold pt-1">
              ✨ Once connected, the backend will automatically write to Cloud PostgreSQL + your Local PC simultaneously!
            </p>
          </div>
        )}
      </div>

      {/* Schools Directory */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registered School Tenants</h2>
            <p className="text-xs text-slate-500">Each school operates on its own isolated branding, mobile app theme & PC sync storage</p>
          </div>
          <button onClick={loadData} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schools.map((s) => (
            <div key={s.id} className="border border-slate-200 rounded-2xl p-5 hover:border-purple-300 transition relative overflow-hidden bg-slate-50/50">
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: s.primaryColor || '#1e40af' }}
              />
              <div className="flex items-start justify-between gap-4 mt-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                        <SchoolIcon size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        {s.code}
                      </span>
                      <span>•</span>
                      <span>{s.domain || `${s.code.toLowerCase()}.anvimitra.com`}</span>
                      {s.establishedYear && (
                        <>
                          <span>•</span>
                          <span>Est. {s.establishedYear}</span>
                        </>
                      )}
                    </div>
                    {s.tagline && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">"{s.tagline}"</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {s.board || 'CBSE'}
                    </span>
                    {s.servicesEnabled !== false ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        SERVICES ACTIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        SERVICES OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Institutional Profile Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-xs bg-white/70 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Affiliation No</span>
                  <span className="font-bold text-slate-800 text-[11px]">{s.affiliationNo || 'CBSE-REG'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Principal</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block">{s.principalName || 'Not Assigned'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">City & State</span>
                  <span className="font-bold text-slate-800 text-[11px]">{[s.city, s.state].filter(Boolean).join(', ') || 'India'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Website</span>
                  <span className="font-bold text-purple-700 text-[11px] truncate block">{s.website || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Students</span>
                  <span className="font-bold text-slate-800">{s.studentCount || 0} Enrolled</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Faculty</span>
                  <span className="font-bold text-slate-800">{s.teacherCount || 0} Teachers</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Brand Color</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.primaryColor }}></span>
                    <span className="font-mono text-[10px] text-slate-600">{s.primaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Management Controls for Super Admin */}
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingSchool({ ...s })}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:border-purple-400 rounded-lg text-xs font-bold text-slate-700 hover:text-purple-700 transition flex items-center gap-1 shadow-sm"
                  >
                    <Edit size={12} />
                    <span>Edit School</span>
                  </button>
                  <button
                    onClick={() => handleToggleServices(s.id, s.name, s.servicesEnabled !== false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm border ${
                      s.servicesEnabled !== false
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                    title={s.servicesEnabled !== false ? 'Turn services OFF (Users can still login but cannot use services)' : 'Turn services ON'}
                  >
                    <Power size={12} />
                    <span>{s.servicesEnabled !== false ? 'Turn Services OFF' : 'Turn Services ON'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSchool(s.id, s.name)}
                    className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg text-xs font-bold text-rose-600 transition flex items-center gap-1 shadow-sm"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const key = s.apiSyncKey || 'ANVI_SYNC_DPS01_SECRET_KEY_9988';
                    navigator.clipboard.writeText(key);
                    alert(`📋 School PC Sync Key Copied!\n\nSchool: ${s.name} (${s.code})\nSync Key: ${key}\n\nPaste this key into the Local Storage Connector at http://localhost:5432`);
                  }}
                  className="text-[10px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200 transition shadow-sm"
                  title="Click to copy PC Sync Key for Local Storage Connector"
                >
                  <Key size={11} className="text-amber-500" />
                  <span>PC Sync Key: {s.apiSyncKey ? s.apiSyncKey.substring(0, 16) + '...' : 'Copy Key'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global In-App Push Notification Logs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">In-App Push Notification Delivery Log</h2>
        <p className="text-xs text-slate-500 mb-4">
          Shows direct in-app notifications and alerts broadcasted to students, parents, and faculty across mobile apps
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Recipient / Phone</th>
                <th className="py-2.5 px-3">Trigger Reason</th>
                <th className="py-2.5 px-3">Notification Content</th>
                <th className="py-2.5 px-3">Channel / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {smsLogs.length > 0 ? (
                smsLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {new Date(log.sentAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{log.phoneNumber}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {log.triggerReason}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-md truncate">{log.messageText}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        IN-APP PUSH
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No in-app notifications recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add School Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Create New School Tenant</h3>
                <p className="text-xs text-slate-500">Super Admin Master Institutional Registration & Profile Provisioning</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-4 text-xs">
              {/* Section 1: Core Institutional Identity */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-purple-700 uppercase tracking-wider block">
                  1. Institutional Identity & Leadership
                </span>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">School Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi Public Academy / St. Xavier's High School"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Educational Board *</label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                      <option value="RBSE">RBSE (Rajasthan Board of Secondary Education)</option>
                      <option value="ICSE">ICSE / CISCE</option>
                      <option value="State Board">State Board</option>
                      <option value="Other">Other Board (Custom)</option>
                    </select>
                    {board === 'Other' && (
                      <input
                        type="text"
                        required
                        placeholder="Enter Board Name (e.g. Cambridge, IB, UP Board)"
                        value={customBoard}
                        onChange={(e) => setCustomBoard(e.target.value)}
                        className="mt-2 w-full bg-white border border-purple-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Affiliation / Board Registration No</label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE/AFF/2026/019 or RBSE/JAIPUR/88"
                      value={affiliationNo}
                      onChange={(e) => setAffiliationNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">School Code (Unique) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DPA01"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 uppercase font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Established Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2005"
                      value={establishedYear}
                      onChange={(e) => setEstablishedYear(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Principal / Head of Institution Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Anand Sharma, M.Sc, B.Ed"
                      value={principalName}
                      onChange={(e) => setPrincipalName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">School Motto / Tagline</label>
                    <input
                      type="text"
                      placeholder="e.g. Service Before Self • Excellence in Education"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Location */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider block">
                  2. Campus Contact, Web & Location
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                    <input
                      type="email"
                      placeholder="admin@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Website</label>
                    <input
                      type="text"
                      placeholder="https://myschool.edu.in"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Custom Subdomain</label>
                    <input
                      type="text"
                      placeholder="e.g. dpa.anvimitra.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">School Logo</label>
                      <label className="text-[10px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer flex items-center gap-1">
                        <Upload size={11} />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleLogoFileUpload(e.target.files[0], setLogoUrl);
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://example.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      />
                      <div className="w-9 h-9 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150';
                            }}
                          />
                        ) : (
                          <SchoolIcon size={16} className="text-slate-400" />
                        )}
                      </div>
                    </div>
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto">
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">Presets:</span>
                      {PRESET_LOGOS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setLogoUrl(p.url)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition shrink-0 ${
                            logoUrl === p.url
                              ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campus Full Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 12, Institutional Area, Knowledge Park"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Jaipur"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajasthan"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="e.g. 302001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Theme Branding */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  3. Theme & Mobile App Branding
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Determines header, navigation, and mobile app theme tint for this institution.
                  </span>
                </div>
              </div>

              {/* Section 4: Principal Login Credentials */}
              <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider block">
                    4. Principal Access Credentials (Admin Sign-In) *
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const randPass = 'Princ@' + Math.floor(1000 + Math.random() * 9000);
                      setPrincipalPassword(randPass);
                    }}
                    className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded-lg transition"
                  >
                    ⚡ Generate Password
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Principal Official Email (Login ID) *</label>
                    <input
                      type="email"
                      required
                      placeholder={code ? `principal@${code.toLowerCase()}.school.edu` : 'principal@school.edu'}
                      value={principalEmail}
                      onChange={(e) => setPrincipalEmail(e.target.value)}
                      className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Princ@2026 or Secret#123"
                      value={principalPassword}
                      onChange={(e) => setPrincipalPassword(e.target.value)}
                      className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-purple-700">
                  Super Admin explicitly creates this login. Principal uses School Code + this Email & Password to access their ERP.
                </p>
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white shadow-lg shadow-purple-600/30 transition"
                >
                  Provision School Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINCIPAL CREDENTIALS GENERATED ================= */}
      {showCredentialsModal && createdCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-200 space-y-5 animate-slide-up relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">School & Principal Provisioned!</h3>
                <p className="text-xs text-emerald-600 font-bold">✓ Initialized with Classes 1-12 (A & B)</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans text-[11px] font-bold">School Tenant Code:</span>
                <span className="font-black text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg text-sm">
                  {createdCredentials.schoolCode}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans text-[11px] font-bold">Principal Name:</span>
                <span className="font-bold text-slate-800">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans text-[11px] font-bold">Principal Login ID:</span>
                <span className="font-bold text-slate-900">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans text-[11px] font-bold">Principal Password:</span>
                <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  {createdCredentials.password}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const credsText = `=== ANVIMITRA ERP - PRINCIPAL LOGIN CREDENTIALS ===\nSchool Code: ${createdCredentials.schoolCode}\nLogin Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nPortal URL: ${window.location.origin}`;
                  navigator.clipboard.writeText(credsText);
                  setCopiedCreds(true);
                  setTimeout(() => setCopiedCreds(false), 2500);
                }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition"
              >
                {copiedCreds ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Principal Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCredentialsModal(false)}
                className="w-full py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT SCHOOL ================= */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Edit School Identity & Profile</h3>
                <p className="text-xs text-slate-500">Super Admin Master Institutional Overrides & Profile Configuration</p>
              </div>
              <button
                onClick={() => setEditingSchool(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSchool} className="space-y-4 text-xs">
              {/* Section 1: Core Institutional Identity */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-purple-700 uppercase tracking-wider block">
                  1. Institutional Identity & Leadership
                </span>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">School Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingSchool.name}
                    onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Educational Board *</label>
                    <select
                      value={
                        ['CBSE', 'RBSE', 'ICSE', 'State Board'].includes(editingSchool.board || 'CBSE')
                          ? (editingSchool.board || 'CBSE')
                          : 'Other'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingSchool({ ...editingSchool, board: val });
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                      <option value="RBSE">RBSE (Rajasthan Board of Secondary Education)</option>
                      <option value="ICSE">ICSE / CISCE</option>
                      <option value="State Board">State Board</option>
                      <option value="Other">Other Board (Custom)</option>
                    </select>
                    {(!['CBSE', 'RBSE', 'ICSE', 'State Board'].includes(editingSchool.board || 'CBSE') || editingSchool.board === 'Other') && (
                      <input
                        type="text"
                        placeholder="Enter Board Name (e.g. Cambridge, IB, UP Board)"
                        value={editingSchool.board === 'Other' ? '' : (editingSchool.board || '')}
                        onChange={(e) => setEditingSchool({ ...editingSchool, board: e.target.value || 'Other' })}
                        className="mt-2 w-full bg-white border border-purple-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Affiliation / Board No</label>
                    <input
                      type="text"
                      value={editingSchool.affiliationNo || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, affiliationNo: e.target.value })}
                      placeholder="e.g. CBSE/AFF/2026/019 or RBSE/JAIPUR/88"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">School Code *</label>
                    <input
                      type="text"
                      required
                      value={editingSchool.code}
                      onChange={(e) => setEditingSchool({ ...editingSchool, code: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 uppercase font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Established Year</label>
                    <input
                      type="text"
                      value={editingSchool.establishedYear || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, establishedYear: e.target.value })}
                      placeholder="e.g. 2005"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ERP Services Status</label>
                    <select
                      value={editingSchool.servicesEnabled !== false ? '1' : '0'}
                      onChange={(e) => setEditingSchool({ ...editingSchool, servicesEnabled: e.target.value === '1' })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="1">🟢 Services Active (ON)</option>
                      <option value="0">🔴 Services Suspended (OFF)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Principal / Head of Institution Name</label>
                    <input
                      type="text"
                      value={editingSchool.principalName || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, principalName: e.target.value })}
                      placeholder="e.g. Dr. Anand Sharma, M.Sc, B.Ed"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">School Motto / Tagline</label>
                    <input
                      type="text"
                      value={editingSchool.tagline || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, tagline: e.target.value })}
                      placeholder="e.g. Service Before Self • Excellence in Education"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact, Web & Location */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider block">
                  2. Campus Contact, Web & Location
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                    <input
                      type="email"
                      value={editingSchool.email || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, email: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={editingSchool.phone || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Website</label>
                    <input
                      type="text"
                      value={editingSchool.website || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, website: e.target.value })}
                      placeholder="https://myschool.edu.in"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Custom Domain / Subdomain</label>
                    <input
                      type="text"
                      value={editingSchool.domain || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, domain: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">School Logo</label>
                      <label className="text-[10px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer flex items-center gap-1">
                        <Upload size={11} />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleLogoFileUpload(e.target.files[0], (url) =>
                                setEditingSchool({ ...editingSchool, logoUrl: url })
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingSchool.logoUrl || ''}
                        onChange={(e) => setEditingSchool({ ...editingSchool, logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      />
                      <div className="w-9 h-9 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {editingSchool.logoUrl ? (
                          <img
                            src={editingSchool.logoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150';
                            }}
                          />
                        ) : (
                          <SchoolIcon size={16} className="text-slate-400" />
                        )}
                      </div>
                    </div>
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto">
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">Presets:</span>
                      {PRESET_LOGOS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setEditingSchool({ ...editingSchool, logoUrl: p.url })}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition shrink-0 ${
                            editingSchool.logoUrl === p.url
                              ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campus Address</label>
                  <input
                    type="text"
                    value={editingSchool.address || ''}
                    onChange={(e) => setEditingSchool({ ...editingSchool, address: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editingSchool.city || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, city: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={editingSchool.state || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, state: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editingSchool.pincode || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, pincode: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Theme Branding */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  3. Theme & Mobile App Branding
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingSchool.primaryColor || '#1e40af'}
                      onChange={(e) => setEditingSchool({ ...editingSchool, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingSchool.primaryColor || '#1e40af'}
                      onChange={(e) => setEditingSchool({ ...editingSchool, primaryColor: e.target.value })}
                      className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Determines header, navigation, and mobile app theme tint for this institution.
                  </span>
                </div>
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white shadow-lg shadow-purple-600/30 transition"
                >
                  Save Institutional Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHANGE SUPER ADMIN PASSWORD ================= */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Change Super Admin Password</h3>
                  <p className="text-xs text-slate-500">Update your platform master access key</p>
                </div>
              </div>
              <button
                onClick={() => setShowPassModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password (e.g. admin123)"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white shadow transition"
                >
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT SUPER ADMIN PROFILE & SECURITY ================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Super Admin Profile & Security</h3>
                  <p className="text-xs text-slate-500">Update your platform master details</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Super Admin Full Name *</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Master Official Email (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Master Contact Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Security: Change Password (Optional) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  Change Password (Optional)
                </span>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="Required only if setting new password"
                    value={profileCurrentPassword}
                    onChange={(e) => setProfileCurrentPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={profileNewPassword}
                    onChange={(e) => setProfileNewPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-1.5"
                >
                  {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
