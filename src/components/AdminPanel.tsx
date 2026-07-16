import React, { useState } from 'react';
import { User, AuditLog, PromptTemplate } from '../types';
import { Shield, Users, FileCode, Plus, Trash2, ShieldCheck, ShieldAlert, AlertTriangle, Terminal, Key, Cpu, HelpCircle, ToggleLeft, ToggleRight } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  logs: AuditLog[];
  prompts: PromptTemplate[];
  onToggleUserSuspension: (id: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onAddPrompt: (prompt: Omit<PromptTemplate, 'id'>) => Promise<void>;
  onDeletePrompt: (id: string) => Promise<void>;
}

export default function AdminPanel({
  users,
  logs,
  prompts,
  onToggleUserSuspension,
  onDeleteUser,
  onAddPrompt,
  onDeletePrompt
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'prompts'>('users');
  
  // Prompt builder state
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    category: 'General' as 'Coding' | 'Legal' | 'Marketing' | 'General' | 'Enterprise'
  });
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.name || !newPrompt.systemPrompt) return;

    setAddingPrompt(true);
    try {
      await onAddPrompt(newPrompt);
      setNewPrompt({ name: '', description: '', systemPrompt: '', category: 'General' });
      setSuccessMsg('Prompt template deployed to production environment successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingPrompt(false);
    }
  };

  return (
    <div className="space-y-6" id="admin-view">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          Enterprise Administration Panel
        </h2>
        <p className="text-sm text-slate-400">
          Supervise corporate directories, evaluate security compliance audit trails, and manage model-wide agent prompt policies.
        </p>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-400 font-bold bg-slate-900/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Workspace Directory</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'prompts'
              ? 'border-indigo-500 text-indigo-400 font-bold bg-slate-900/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4" />
            <span>Agent Prompts Policy</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'logs'
              ? 'border-indigo-500 text-indigo-400 font-bold bg-slate-900/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Terminal className="w-4 h-4" />
            <span>Compliance Audit Trails</span>
          </div>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-200">Active Workspace Nodes</h3>
            <p className="text-xs text-slate-500">Configure roles or suspend access accounts to safe-guard organizational boundaries.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">User Identity / Email</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Provisioned Date</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-950/40 transition-colors duration-150">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{u.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-400">
                      {u.role}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {u.joinedDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        u.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-3">
                      <button
                        onClick={() => onToggleUserSuspension(u.id)}
                        className={`text-[11px] font-semibold hover:underline cursor-pointer ${
                          u.status === 'Active' ? 'text-amber-500' : 'text-emerald-500'
                        }`}
                      >
                        {u.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => onDeleteUser(u.id)}
                        className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Create */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Deploy System Agent</h3>
              <p className="text-[11px] text-slate-500">Inject custom cognitive boundaries and templates system-wide.</p>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handlePromptSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Agent Persona Title</label>
                <input
                  type="text"
                  required
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                  placeholder="e.g. Compliance Risk Auditing"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Classification Domain</label>
                <select
                  value={newPrompt.category}
                  onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="General">General</option>
                  <option value="Coding">Coding</option>
                  <option value="Legal">Legal</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Brief Operational Objective</label>
                <input
                  type="text"
                  value={newPrompt.description}
                  onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                  placeholder="Summarize the core prompt scope..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">System Prompts Core Instructions</label>
                <textarea
                  required
                  rows={4}
                  value={newPrompt.systemPrompt}
                  onChange={(e) => setNewPrompt({ ...newPrompt, systemPrompt: e.target.value })}
                  placeholder="You are an expert... Your style is strict, cautious... Follow..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={addingPrompt}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium text-xs rounded-lg transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {addingPrompt ? 'Injecting Policies...' : 'Deploy System Prompt'}
              </button>
            </form>
          </div>

          {/* List Prompts */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Deployed Policy Templates</h3>
              <p className="text-xs text-slate-500">System-wide instruction guidelines applied to conversations.</p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-1">
              {prompts.map((p) => (
                <div key={p.id} className="bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/60 rounded-xl p-4 flex justify-between gap-4 transition-all duration-150">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <p className="text-xs font-bold text-slate-100">{p.name}</p>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.2 rounded font-bold uppercase">{p.category}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium italic">{p.description}</p>
                    <div className="bg-slate-900 p-2.5 border border-slate-850 rounded-lg font-mono text-[10px] text-slate-400 truncate max-w-sm sm:max-w-md">
                      {p.systemPrompt}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeletePrompt(p.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0 transition-all duration-200 cursor-pointer h-fit self-center"
                    title="Delete prompt template"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-200">Compliance & Security Trail Log</h3>
            <p className="text-xs text-slate-500 font-medium">Trace all real-time API routes invocation, console actions, and telemetry anomalies.</p>
          </div>

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-[11px] overflow-y-auto max-h-[380px] space-y-2.5">
            {logs.length === 0 ? (
              <p className="text-slate-600 text-center py-6">No compliance audit logs indexed yet.</p>
            ) : (
              logs.map((log) => {
                let badgeColor = 'text-blue-400 bg-blue-500/10';
                if (log.type === 'error') badgeColor = 'text-red-400 bg-red-500/10';
                if (log.type === 'security') badgeColor = 'text-amber-400 bg-amber-500/10';

                return (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 border-b border-slate-900 pb-2">
                    <span className="text-slate-500 font-medium shrink-0">[{log.timestamp.substring(11, 19)}]</span>
                    <span className={`px-1.5 py-0.2 h-fit text-[9px] font-bold rounded uppercase shrink-0 ${badgeColor}`}>{log.type}</span>
                    <div className="flex-1">
                      <span className="text-indigo-400 font-semibold">{log.userEmail}</span>
                      <span className="text-slate-500"> • </span>
                      <span className="text-slate-300 font-semibold">{log.action}: </span>
                      <span className="text-slate-400 font-medium">{log.details}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
