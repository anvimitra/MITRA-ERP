import React, { useState, useEffect } from 'react';
import { School, SMSLogItem } from '../types';
import { ApiService } from '../api';
import { School as SchoolIcon, Plus, Cloud, Server, MessageSquare, ShieldCheck, CheckCircle2, Key, RefreshCw, Trash2, Edit, Lock, X } from 'lucide-react';

export const SuperAdminPortal: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [smsLogs, setSmsLogs] = useState<SMSLogItem[]>([]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Add school form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
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

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getSchools();
      setSchools(res.schools || []);
      const smsRes = await ApiService.getSMSLogs().catch(() => ({ smsLogs: [] }));
      setSmsLogs(smsRes.smsLogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createSchool({
        name,
        code,
        domain,
        primaryColor,
        phone,
        email,
        address,
        affiliationNo,
        principalName,
        city,
        state: stateName,
        pincode,
        website,
        establishedYear,
        tagline,
        logoUrl,
      });
      alert('✅ New School Tenant created successfully with full profile!');
      setShowAddModal(false);
      setName('');
      setCode('');
      setDomain('');
      setPhone('');
      setEmail('');
      setAddress('');
      setAffiliationNo('');
      setPrincipalName('');
      setCity('');
      setStateName('');
      setPincode('');
      setWebsite('');
      setEstablishedYear('');
      setTagline('');
      setLogoUrl('');
      loadData();
    } catch (err: any) {
      alert('Error creating school: ' + err.message);
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
            onClick={() => setShowPassModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white font-bold text-xs border border-purple-700/60 shadow transition"
          >
            <Lock size={15} />
            <span>Change My Password</span>
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
                  {s.logoUrl && (
                    <img src={s.logoUrl} alt={s.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white" />
                  )}
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
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ACTIVE
                </span>
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
                    onClick={() => handleDeleteSchool(s.id, s.name)}
                    className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg text-xs font-bold text-rose-600 transition flex items-center gap-1 shadow-sm"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
                <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  <Key size={11} className="text-amber-500" /> PC Sync Key
                </span>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <label className="block font-bold text-slate-700 mb-1">Affiliation / Board No</label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE/AFF/2026/019"
                      value={affiliationNo}
                      onChange={(e) => setAffiliationNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                    <label className="block font-bold text-slate-700 mb-1">School Logo URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
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
                    <label className="block font-bold text-slate-700 mb-1">Affiliation / Board No</label>
                    <input
                      type="text"
                      value={editingSchool.affiliationNo || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, affiliationNo: e.target.value })}
                      placeholder="e.g. CBSE/AFF/2026/019"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
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
                    <label className="block font-bold text-slate-700 mb-1">School Logo URL</label>
                    <input
                      type="url"
                      value={editingSchool.logoUrl || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
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
    </div>
  );
};
