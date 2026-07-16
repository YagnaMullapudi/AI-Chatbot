import React, { useState } from 'react';
import { AnalyticsStats, Document } from '../types';
import { BarChart3, Users, Zap, Clock, ShieldCheck, Download, Calendar, ArrowUpRight, TrendingUp, HelpCircle } from 'lucide-react';

interface DashboardViewProps {
  stats: AnalyticsStats;
  documents: Document[];
  onNavigateToDocs: () => void;
}

export default function DashboardView({ stats, documents, onNavigateToDocs }: DashboardViewProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      // Simulate simple data download
      const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(stats, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonStr);
      downloadAnchor.setAttribute('download', 'enterprise_chatbot_analytics_report.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }, 1200);
  };

  // Find max chats and tokens to scale SVG charts safely
  const maxChats = Math.max(...stats.dailyVolume.map(d => d.chats), 1);
  const maxTokens = Math.max(...stats.dailyVolume.map(d => d.tokens), 1);

  return (
    <div className="space-y-6" id="dashboard-view">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100 tracking-tight">System Performance & Insights</h2>
          <p className="text-sm text-slate-400">Real-time usage metrics, intelligence logs, and workspace growth.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium text-sm rounded-lg transition-all duration-200 border border-indigo-500/30 shadow-md shadow-indigo-900/20 cursor-pointer self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Compiling Report...' : 'Export Analytics Report'}
        </button>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Workspace Users</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">{stats.totalUsers}</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center">
                +4.2% <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Active active directory nodes</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Daily Chat Volume */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300"></div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Daily Conversations</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">{stats.dailyChats}</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center">
                +11.5% <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Conversations completed today</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        {/* AI Tokens Consumed */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-300"></div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Token Utilization</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">158.3K</span>
              <span className="text-xs font-medium text-amber-400 flex items-center">
                Avg. 3.8K/chat
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Gemini model output weight</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Latency Time</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">{stats.averageResponseTimeMs}ms</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center">
                Fast (Gemini Flash)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Server-side execution stream</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Custom Chart */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Weekly Performance Trends</h3>
              <p className="text-xs text-slate-400">Visual mapping of active chats volume and overall prompt tokens.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Chats
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Tokens (scaled)
              </span>
            </div>
          </div>

          {/* Render Custom Vector SVG Chart */}
          <div className="w-full h-64 bg-slate-950/40 rounded-lg p-4 border border-slate-900 flex flex-col justify-between">
            <div className="flex-1 relative flex items-end justify-between px-2 pt-6">
              {/* Horizontal Reference Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-slate-700 w-full h-0"></div>
                <div className="border-b border-slate-700 w-full h-0"></div>
                <div className="border-b border-slate-700 w-full h-0"></div>
                <div className="border-b border-slate-700 w-full h-0"></div>
              </div>

              {/* Data Bars */}
              {stats.dailyVolume.map((d, idx) => {
                const chatHeightPct = Math.round((d.chats / maxChats) * 85);
                const tokenHeightPct = Math.round((d.tokens / maxTokens) * 80);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative z-10 mx-1 sm:mx-2">
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-[10px] text-slate-200 border border-slate-700 p-2 rounded shadow-xl hidden group-hover:block z-50 min-w-[120px] pointer-events-none">
                      <p className="font-semibold text-slate-100 border-b border-slate-800 pb-1 mb-1">{d.date}</p>
                      <p className="flex justify-between"><span>Chats:</span> <b className="text-indigo-400">{d.chats}</b></p>
                      <p className="flex justify-between"><span>Tokens:</span> <b className="text-amber-400">{(d.tokens / 1000).toFixed(1)}k</b></p>
                    </div>

                    {/* Bars stacked next to each other */}
                    <div className="w-full flex items-end justify-center gap-1">
                      {/* Chats Bar */}
                      <div
                        className="w-3 sm:w-4 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t transition-all duration-500 hover:brightness-110 shadow-lg shadow-indigo-900/20"
                        style={{ height: `${chatHeightPct}%` }}
                      ></div>
                      {/* Tokens Bar */}
                      <div
                        className="w-1.5 sm:w-2 bg-slate-700 rounded-t transition-all duration-500 group-hover:bg-slate-600"
                        style={{ height: `${tokenHeightPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis labels */}
            <div className="flex justify-between px-2 border-t border-slate-800/80 pt-2 mt-2 text-[10px] text-slate-500 font-mono">
              {stats.dailyVolume.map((d, idx) => (
                <span key={idx} className="flex-1 text-center truncate">
                  {d.date.substring(5)}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chat interactions are up 15.4% week-over-week. Document referencing active.</span>
          </div>
        </div>

        {/* Right Panel: Popular questions & RAG state */}
        <div className="space-y-6">
          {/* Popular Questions */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Frequently Asked Queries
            </h3>
            <div className="space-y-3">
              {stats.popularQuestions.map((q, idx) => {
                const maxCount = Math.max(...stats.popularQuestions.map(item => item.count), 1);
                const barWidth = Math.round((q.count / maxCount) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[200px]">{q.question}</span>
                      <span className="text-slate-500 font-mono">{q.count} lookups</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RAG Knowledge Base State */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Knowledge Base & RAG Index
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                Active ({stats.uploadedDocuments})
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-300">Grounding Footprint</p>
                  <p className="text-[10px] text-slate-500">Total chunk size processed</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">{stats.knowledgeBaseSizeKb} KB</span>
              </div>

              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                <p className="text-xs font-semibold text-slate-300 mb-2">Connected Document Sources</p>
                {documents.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No active knowledge files. Upload files to get started.</p>
                ) : (
                  <div className="space-y-1.5">
                    {documents.slice(0, 3).map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[150px]">{d.name}</span>
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${d.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-800 text-slate-500'}`}>
                          {d.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                    {documents.length > 3 && (
                      <p className="text-[10px] text-indigo-400 hover:underline cursor-pointer" onClick={onNavigateToDocs}>
                        + {documents.length - 3} more sources. Click to view all.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
