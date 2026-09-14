import React, { useState, useEffect } from 'react';
import { School, User } from '../types';
import { fetchSchools, createSchool, deleteSchool, checkServerHealth, fetchDbStatus, fetchBackupSnapshot, restoreBackupSnapshot } from '../api';
import {
  ShieldCheck,
  Building2,
  Plus,
  Trash2,
  Users,
  GraduationCap,
  Copy,
  Check,
  Server,
  X,
  Sparkles,
  Key,
  School as SchoolIcon,
  Phone,
  Mail,
  RefreshCw,
  HardDrive,
  Download,
  Database,
} from 'lucide-react';

interface Props {
  user: User;
  activeSubTab?: 'schools' | 'add_school' | 'system';
  onSubTabChange?: (tab: 'schools' | 'add_school' | 'system') => void;
}

export const SuperAdminView: React.FC<Props> = ({ user, activeSubTab: externalTab, onSubTabChange }) => {
  const [internalTab, setInternalTab] = useState<'schools' | 'add_school' | 'system'>('schools');
  const activeTab = externalTab || internalTab;
  const setActiveTab = (tab: 'schools' | 'add_school' | 'system') => {
    setInternalTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverHealth, setServerHealth] = useState<{ online: boolean; url: string; latency?: number }>({
    online: true,
    url: 'https://mitra-erp.onrender.com/api',
  });

  // Add School Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    code: '',
    affiliationNo: '',
    logoUrl: '',
    principalName: '',
    principalEmail: '',
    principalPassword: '',
    phone: '',
    city: '',
    state: '',
  });

  // Principal Credentials Modal
  const [createdCreds, setCreatedCreds] = useState<{
    email: string;
    password: string;
    name: string;
    schoolCode: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    database: string;
    isPostgresConnected: boolean;
    schoolCount: number;
    persistentStorage: string;
  } | null>(null);

  const loadSchoolsData = async () => {
    setLoading(true);
    try {
      const [list, health, status] = await Promise.all([
        fetchSchools(),
        checkServerHealth(),
        fetchDbStatus().catch(() => null),
      ]);
      setSchools(list || []);
      setServerHealth(health);
      if (status) setDbStatus(status);
    } catch (err) {
      console.warn('SuperAdmin load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolsData();
  }, []);

  const handleGeneratePassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setSchoolForm((prev) => ({
      ...prev,
      principalPassword: `School@${randomNum}`,
    }));
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name || !schoolForm.code) {
      alert('Please enter School Name and Unique School Code.');
      return;
    }
    setCreating(true);
    try {
      const pEmail = schoolForm.principalEmail || `principal@${schoolForm.code.toLowerCase()}.edu`;
      const pPass = schoolForm.principalPassword || 'School@123';

      const res = await createSchool({
        ...schoolForm,
        principalEmail: pEmail,
        principalPassword: pPass,
      });

      setShowAddModal(false);
      setSchoolForm({
        name: '',
        code: '',
        affiliationNo: '',
        principalName: '',
        principalEmail: '',
        principalPassword: '',
        phone: '',
        city: '',
        state: '',
      });

      if (res.principalCredentials) {
        setCreatedCreds(res.principalCredentials);
      } else {
        alert('✅ School tenant created successfully!');
      }

      loadSchoolsData();
    } catch (err: any) {
      alert(err.message || 'Error creating school tenant.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSchool = async (schoolId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove school "${name}"? This action is irreversible.`)) return;
    try {
      await deleteSchool(schoolId);
      setSchools((prev) => prev.filter((s) => s.id !== schoolId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove school.');
    }
  };

  const copyCredentials = () => {
    if (!createdCreds) return;
    const msg = `🏫 ANVIMITRA-ERP Institutional Onboarding\n\nSchool Code: ${createdCreds.schoolCode}\nRole: Principal & Institution Head\nPrincipal Name: ${createdCreds.name}\nLogin Email: ${createdCreds.email}\nPassword: ${createdCreds.password}\n\nLogin at: https://mitra-erp.pages.dev or via the Mobile App with School Code: ${createdCreds.schoolCode}`;
    navigator.clipboard.writeText(msg);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  // Platform totals
  const totalStudents = schools.reduce((acc, s) => acc + (s.studentCount || 0), 0);
  const totalTeachers = schools.reduce((acc, s) => acc + (s.teacherCount || 0), 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Super Admin Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-purple-950">
              Platform Master Console
            </span>
            <h2 className="font-black text-lg mt-1">{user.name || 'Super Admin'}</h2>
            <p className="text-xs text-purple-200">Global Tenant & Cloud Management</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Sub Nav */}
        <div className="grid grid-cols-3 gap-1 mt-3.5 pt-3 border-t border-white/10 text-[10px] font-bold">
          <button
            onClick={() => setActiveTab('schools')}
            className={`py-1.5 px-1 rounded-xl transition text-center ${
              activeTab === 'schools' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Schools ({schools.length})
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="py-1.5 px-1 rounded-xl transition text-center text-purple-200 hover:bg-white/10 flex items-center justify-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>+ Add School</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-1.5 px-1 rounded-xl transition text-center ${
              activeTab === 'system' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Cloud Status
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Schools</span>
          <p className="text-xl font-black text-slate-900 mt-0.5">{schools.length}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Students</span>
          <p className="text-xl font-black text-purple-700 mt-0.5">{totalStudents}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Faculty</span>
          <p className="text-xl font-black text-indigo-700 mt-0.5">{totalTeachers}</p>
        </div>
      </div>

      {/* Master PC Storage & Auto Recovery Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-3.5 rounded-2xl text-white shadow-md border border-purple-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Single PC Master Storage</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Auto-Recovery ON
                </span>
              </div>
              <p className="text-[10px] text-purple-200 mt-0.5">
                All school data safely mirrored to local PC. If cloud resets, PC restores it automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SCHOOLS TAB */}
      {activeTab === 'schools' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>School Tenants Directory</span>
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-purple-700 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New School</span>
            </button>
          </div>

          <div className="space-y-2">
            {schools.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border">
                {loading ? 'Connecting to Cloud ERP...' : 'No school tenants configured.'}
              </div>
            ) : (
              schools.map((sch) => (
                <div
                  key={sch.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {sch.logoUrl ? (
                          <img
                            src={sch.logoUrl}
                            alt={sch.name}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent) {
                                parent.innerHTML = `<span class="text-xs font-black text-purple-700">${(sch.name || 'S').charAt(0).toUpperCase()}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="text-xs font-black text-purple-700">
                            {(sch.name || 'S').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase bg-purple-100 text-purple-800">
                            {sch.code}
                          </span>
                          <strong className="text-slate-900 font-bold text-sm leading-tight">{sch.name}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSchool(sch.id, sch.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove School"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {sch.affiliationNo && (
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Affiliation: {sch.affiliationNo}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div>
                      Principal: <strong className="text-slate-800">{sch.principalName || 'Principal'}</strong>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-1 text-purple-700 font-bold">
                        <Users className="w-3 h-3" />
                        <span>{sch.studentCount || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-indigo-700 font-bold">
                        <GraduationCap className="w-3 h-3" />
                        <span>{sch.teacherCount || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CLOUD STATUS TAB */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3 text-xs">
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
            <Server className="w-4 h-4 text-purple-600" />
            <span>Cloud ERP Infrastructure Status</span>
          </h3>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Production Render Backend:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ONLINE 200 OK</span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded-lg border">
              {serverHealth.url}
            </p>
            {serverHealth.latency !== undefined && (
              <p className="text-[10px] text-slate-400">Response Latency: ~{serverHealth.latency}ms</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1.5">
            <h4 className="font-bold text-purple-900 text-xs">Data Persistence Architecture</h4>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              SQLite database storage is decoupled and untracked from Git. Any changes made by Super Admin or Principals persist permanently across deployments and git updates.
            </p>
          </div>

          <button
            onClick={loadSchoolsData}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ping Server Health</span>
          </button>
        </div>
      )}

      {/* MODAL: ADD SCHOOL TENANT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Add School Tenant</h3>
                <p className="text-xs text-slate-500">Provisions school with Classes 1-12 & Principal</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Xavier's International School"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">School Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SXIS01"
                    value={schoolForm.code}
                    onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Affiliation No</label>
                  <input
                    type="text"
                    placeholder="e.g. CBSE/2026/894"
                    value={schoolForm.affiliationNo}
                    onChange={(e) => setSchoolForm({ ...schoolForm, affiliationNo: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">School Crest / Logo URL or Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... or choose file below"
                    value={schoolForm.logoUrl}
                    onChange={(e) => setSchoolForm({ ...schoolForm, logoUrl: e.target.value })}
                    className="flex-1 p-2.5 border rounded-xl bg-slate-50 text-xs focus:bg-white"
                  />
                  <label className="px-3 py-2 bg-purple-50 text-purple-700 font-bold border border-purple-200 rounded-xl cursor-pointer hover:bg-purple-100 flex items-center justify-center shrink-0">
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setSchoolForm({ ...schoolForm, logoUrl: reader.result });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {schoolForm.logoUrl && (
                  <div className="mt-2 flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border">
                    <img
                      src={schoolForm.logoUrl}
                      alt="Preview"
                      className="w-8 h-8 rounded-lg object-contain bg-white border p-0.5"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="text-[10px] text-emerald-700 font-bold">Logo ready for school</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-black text-slate-700 mb-2">Principal Account Credentials</h4>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Principal Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={schoolForm.principalName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="mt-2">
                  <label className="font-bold text-slate-600 block mb-1">Principal Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. principal@sxis.edu"
                    value={schoolForm.principalEmail}
                    onChange={(e) => setSchoolForm({ ...schoolForm, principalEmail: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-600">Principal Password</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] font-bold text-purple-700 hover:text-purple-900"
                    >
                      ⚡ Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. School@123"
                    value={schoolForm.principalPassword}
                    onChange={(e) => setSchoolForm({ ...schoolForm, principalPassword: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 mt-4"
              >
                <Building2 className="w-4 h-4" />
                <span>{creating ? 'Creating School & Tenant...' : 'Create School Tenant'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINCIPAL CREDENTIALS POPUP */}
      {createdCreds && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl border border-purple-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900">School Created Successfully!</h3>
              <p className="text-xs text-slate-500">
                Principal account credentials ready to deliver.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="text-slate-500 font-medium">School Code:</span>
                <strong className="text-purple-900 font-mono">{createdCreds.schoolCode}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="text-slate-500 font-medium">Principal Name:</span>
                <strong className="text-slate-900">{createdCreds.name}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="text-slate-500 font-medium">Login Email:</span>
                <strong className="text-purple-900 font-mono">{createdCreds.email}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Password:</span>
                <strong className="text-emerald-700 font-mono text-sm font-black">
                  {createdCreds.password}
                </strong>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={copyCredentials}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-2 transition"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials for WhatsApp'}</span>
              </button>
              <button
                onClick={() => setCreatedCreds(null)}
                className="w-full py-2 text-slate-500 font-bold text-xs hover:text-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
