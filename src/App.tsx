import React, { useState, useEffect } from 'react';
import { User, Chat, Document, PromptTemplate, AuditLog, AnalyticsStats } from './types';
import DashboardView from './components/DashboardView';
import DocumentUploadView from './components/DocumentUploadView';
import AdminPanel from './components/AdminPanel';
import ChatInterface from './components/ChatInterface';
import {
  Shield, Bot, LayoutDashboard, FileCode, Users, Terminal, BookOpen, Key, LogOut, Lock, Mail, UserPlus,
  RefreshCw, CheckCircle, Info, Sparkles, HelpCircle, GitPullRequest, Database, AlertCircle, FileText
} from 'lucide-react';

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('ent_chat_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'User' as 'Admin' | 'User' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Active view state
  const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'dashboard' | 'admin' | 'guide'>('chat');

  // DB Sync States
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  // Streaming state
  const [streamingText, setStreamingText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Sync data on startup if logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('ent_chat_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (token && currentUser) {
      fetchInitialData();
    }
  }, [token, currentUser?.id]);

  const fetchInitialData = async () => {
    try {
      const [chatsRes, docsRes, promptsRes, statsRes] = await Promise.all([
        fetch('/api/chats'),
        fetch('/api/documents'),
        fetch('/api/prompts'),
        fetch('/api/analytics')
      ]);

      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        setChats(chatsData);
        if (chatsData.length > 0 && !selectedChatId) {
          setSelectedChatId(chatsData[0].id);
        }
      }
      if (docsRes.ok) setDocuments(await docsRes.json());
      if (promptsRes.ok) setPrompts(await promptsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());

      // Admin specific fetches
      if (currentUser?.role === 'Admin') {
        const [logsRes, usersRes] = await Promise.all([
          fetch('/api/logs'),
          fetch('/api/users')
        ]);
        if (logsRes.ok) setLogs(await logsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      }
    } catch (err) {
      console.error('Failed to sync initial workspace databases:', err);
    }
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication rejected');
      }

      localStorage.setItem('ent_chat_token', data.token);
      localStorage.setItem('ent_chat_user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setAuthSuccess('Welcome! Connecting secure container session...');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, name: authForm.name, role: authForm.role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setAuthSuccess('Account registered. Please proceed to login with your password.');
      setAuthView('login');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ent_chat_token');
    localStorage.removeItem('ent_chat_user');
    setToken(null);
    setCurrentUser(null);
    setChats([]);
    setDocuments([]);
    setSelectedChatId(null);
  };

  // Chat Actions
  const handleCreateChat = async (title?: string, folder?: string | null) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, userId: currentUser?.id, folder })
      });
      if (res.ok) {
        const newChat = await res.json();
        setChats(prev => [newChat, ...prev]);
        setSelectedChatId(newChat.id);
        return newChat.id;
      }
    } catch (err) {
      console.error(err);
    }
    return '';
  };

  const handleUpdateChat = async (id: string, updates: Partial<Chat>) => {
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setChats(prev => prev.map(c => c.id === id ? updated : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== id));
        if (selectedChatId === id) {
          setSelectedChatId(chats.find(c => c.id !== id)?.id || null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (
    text: string,
    options: { model: string; systemPrompt: string; temperature: number; stream: boolean }
  ) => {
    let chatId = selectedChatId;
    if (!chatId) {
      chatId = await handleCreateChat(text.substring(0, 24) + '...');
    }

    if (!chatId) return;

    setLoading(true);
    setStreamingText('');

    try {
      if (options.stream) {
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            stream: true,
            customSystemPrompt: options.systemPrompt,
            model: options.model,
            temperature: options.temperature
          })
        });

        if (!response.body) {
          throw new Error('ReadableStream not active');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let accumulated = '';

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            // SSE chunks come in data: {...}\n\n format
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim();
                if (dataStr === '[DONE]') {
                  done = true;
                  break;
                }
                try {
                  const dataObj = JSON.parse(dataStr);
                  if (dataObj.error) {
                    accumulated += `\n\n*[System Error: ${dataObj.error}]*`;
                  } else if (dataObj.chunk) {
                    accumulated += dataObj.chunk;
                    setStreamingText(accumulated);
                  }
                } catch (e) {
                  // silent parse errors on incomplete chunk line boundaries
                }
              }
            }
          }
        }

        setStreamingText('');
        fetchInitialData(); // Reload database
      } else {
        // Non-streaming normal post
        const res = await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            stream: false,
            customSystemPrompt: options.systemPrompt,
            model: options.model,
            temperature: options.temperature
          })
        });

        if (res.ok) {
          fetchInitialData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Feedback
  const handleSubmitFeedback = async (chatId: string, messageId: string, rating: 'up' | 'down', text?: string) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, messageId, rating, feedbackText: text })
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Documents
  const handleUploadDoc = async (name: string, content: string, size: number, type: string, category: string) => {
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, size, type, category })
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin triggers
  const handleToggleUserSuspension = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}/toggle`, { method: 'PUT' });
      if (res.ok) fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPrompt = async (prompt: Omit<PromptTemplate, 'id'>) => {
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
      });
      if (res.ok) fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
      if (res.ok) fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  // Render Authentication Portal if token or user is missing
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl w-fit">
              <Bot className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Enterprise AI Chatbot Platform</h1>
            <p className="text-xs text-slate-400">Secure cryptographic portal login for corporate workspaces</p>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {authView === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    placeholder="name@enterprise.com"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-400">Workspace Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthView('forgot')}
                    className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-all duration-200 shadow-md shadow-indigo-900/30 cursor-pointer"
              >
                Sign In to Platform
              </button>
            </form>
          )}

          {authView === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  placeholder="Sarah Jenkins"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  placeholder="sarah@enterprise.com"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Workspace Role</label>
                <select
                  value={authForm.role}
                  onChange={(e) => setAuthForm({ ...authForm, role: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2.5 text-xs focus:outline-none"
                >
                  <option value="User">Standard Enterprise User</option>
                  <option value="Admin">Administrator (sarah@enterprise.com or contains admin)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-all duration-200 cursor-pointer"
              >
                Register Workspace Node
              </button>
            </form>
          )}

          {authView === 'forgot' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Recovery Email Address</label>
                <input
                  type="email"
                  placeholder="name@enterprise.com"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                />
              </div>
              <button
                onClick={() => { setAuthSuccess('Password recovery email dispatched. check your enterprise mailbox.'); setAuthView('login'); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl cursor-pointer"
              >
                Send Recovery Key
              </button>
            </div>
          )}

          <div className="border-t border-slate-850 pt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              {authView === 'login' ? "Need a workspace node?" : "Already registered?"}
            </span>
            <button
              onClick={() => {
                setAuthView(authView === 'login' ? 'register' : 'login');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              {authView === 'login' ? "Register Node" : "Login Securely"}
            </button>
          </div>

          {/* Quick Admin Creds */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 text-[10px] text-slate-500 space-y-1 leading-normal font-mono">
            <p className="font-semibold text-slate-400">🔑 Instant Portfolio Demo Access:</p>
            <p>Admin: <span className="text-indigo-400">admin@enterprise.com</span> (Password: any)</p>
            <p>Standard: <span className="text-slate-400">analyst@enterprise.com</span> (Password: any)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row relative">
      
      {/* Platform Left Main Navigation Bar */}
      <div className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col justify-between shrink-0 p-4 relative z-30">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-950/50">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-100 tracking-wider uppercase font-mono">Enterprise AI</h1>
              <p className="text-[10px] font-bold text-slate-500">Workspace Node</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
              }`}
            >
              <Bot className="w-4.5 h-4.5" />
              <span>AI Chatbot Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'docs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
              }`}
            >
              <Database className="w-4.5 h-4.5" />
              <span>RAG Document Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>Performance Insights</span>
            </button>

            {/* Admin only Nav */}
            {currentUser.role === 'Admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
                }`}
              >
                <Shield className="w-4.5 h-4.5" />
                <span>Administrator Control</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('guide')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'guide' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              <span>System Documentation</span>
            </button>
          </nav>
        </div>

        {/* User profile drawer bottom */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3 shrink-0">
          <div className="flex items-center gap-3 px-1.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg font-mono text-xs font-bold uppercase">
              {currentUser.name.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>

      {/* Primary Workspace Window */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'chat' && (
          <ChatInterface
            chats={chats}
            prompts={prompts}
            documents={documents}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            onCreateChat={handleCreateChat}
            onUpdateChat={handleUpdateChat}
            onDeleteChat={handleDeleteChat}
            onSendMessage={handleSendMessage}
            onSubmitFeedback={handleSubmitFeedback}
            streamingText={streamingText}
          />
        )}

        {activeTab === 'docs' && (
          <DocumentUploadView
            documents={documents}
            onUpload={handleUploadDoc}
            onToggleEnabled={handleToggleDoc}
            onDelete={handleDeleteDoc}
          />
        )}

        {activeTab === 'dashboard' && stats && (
          <DashboardView
            stats={stats}
            documents={documents}
            onNavigateToDocs={() => setActiveTab('docs')}
          />
        )}

        {activeTab === 'admin' && currentUser.role === 'Admin' && (
          <AdminPanel
            users={users}
            logs={logs}
            prompts={prompts}
            onToggleUserSuspension={handleToggleUserSuspension}
            onDeleteUser={handleDeleteUser}
            onAddPrompt={handleAddPrompt}
            onDeletePrompt={handleDeletePrompt}
          />
        )}

        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                Technical Reference & Architecture Guide
              </h2>
              <p className="text-sm text-slate-400">
                A comprehensive overview of our enterprise-ready Full Stack architecture, database schemas, and data pipelines.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Architecture Blueprint Card */}
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-semibold text-indigo-400 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Architecture Diagram
                </h3>
                
                {/* Visual SVG Diagram */}
                <div className="w-full bg-slate-950 p-4 border border-slate-900 rounded-lg">
                  <svg viewBox="0 0 800 420" className="w-full h-auto text-slate-400 text-xs font-mono">
                    {/* User Node */}
                    <rect x="20" y="160" width="100" height="80" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
                    <text x="35" y="195" fill="#e2e8f0" fontWeight="bold">React SPA</text>
                    <text x="30" y="215" fill="#94a3b8" fontSize="10">TypeScript</text>

                    {/* API Reverse Proxy */}
                    <rect x="200" y="150" width="140" height="100" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                    <text x="220" y="185" fill="#e2e8f0" fontWeight="bold">Express Server</text>
                    <text x="215" y="205" fill="#94a3b8" fontSize="10">Vite Proxy Layer</text>
                    <text x="215" y="225" fill="#94a3b8" fontSize="10">Port 3000 Ingress</text>

                    {/* Gemini AI Gateway */}
                    <rect x="420" y="60" width="140" height="80" rx="8" fill="#0c1d33" stroke="#0284c7" strokeWidth="1.5" />
                    <text x="440" y="95" fill="#e2e8f0" fontWeight="bold">Google GenAI</text>
                    <text x="435" y="115" fill="#38bdf8" fontSize="10">gemini-3.5-flash</text>

                    {/* RAG Context Engine */}
                    <rect x="420" y="260" width="140" height="100" rx="8" fill="#064e3b" stroke="#059669" strokeWidth="1.5" />
                    <text x="440" y="295" fill="#e2e8f0" fontWeight="bold">RAG Engine</text>
                    <text x="430" y="315" fill="#34d399" fontSize="10">TF-IDF Chunking</text>
                    <text x="430" y="335" fill="#34d399" fontSize="10">Sentence Index</text>

                    {/* Local DB */}
                    <rect x="640" y="160" width="120" height="80" rx="8" fill="#450a0a" stroke="#dc2626" strokeWidth="1.5" />
                    <text x="655" y="195" fill="#e2e8f0" fontWeight="bold">Local Store</text>
                    <text x="655" y="215" fill="#f87171" fontSize="10">data/db.json</text>

                    {/* Connective Paths */}
                    <path d="M 120 200 L 200 200" stroke="#6366f1" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                    <path d="M 340 180 L 420 100" stroke="#0284c7" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                    <path d="M 340 210 L 420 280" stroke="#059669" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                    <path d="M 560 100 L 640 180" stroke="#475569" strokeWidth="1.5" strokeDasharray="4" fill="none" />
                    <path d="M 560 300 L 640 220" stroke="#475569" strokeWidth="1.5" strokeDasharray="4" fill="none" />
                    <path d="M 340 200 L 640 200" stroke="#dc2626" strokeWidth="1.5" fill="none" />

                    {/* SVG Arrow definitions */}
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#e2e8f0" />
                      </marker>
                    </defs>
                  </svg>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                  <p><b>Data Ingestion:</b> Files uploaded in the RAG Document Hub are parsed on the Express server. The backend splits the document's contents into overlapping logical paragraphs (chunks) of ~200-500 characters and updates our local database indexes.</p>
                  <p><b>Context Extraction:</b> When queries are dispatched to the chatbot, the RAG Engine computes word overlaps between active user messages and chunk definitions, dynamically retrieving the top 3 most relevant grounded facts.</p>
                  <p><b>Secure AI Generation:</b> The Express backend proxies the search context to the secure server-side Google GenAI client, securely passing system instructions without ever exposing the GEMINI_API_KEY to client networks.</p>
                </div>
              </div>

              {/* API Specs Sidebar */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4 h-fit">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  REST API Documentation
                </h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded w-fit uppercase font-bold">POST /api/auth/login</p>
                    <p className="text-slate-400">Authenticates secure corporate coworker nodes and dispenses encrypted session mock JWTs.</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded w-fit uppercase font-bold">POST /api/chats/:id/messages</p>
                    <p className="text-slate-400">Accepts user message string, executes RAG document grounding, and returns SSE streamed text responses from Gemini.</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded w-fit uppercase font-bold">POST /api/documents/upload</p>
                    <p className="text-slate-400">Accepts text string, generates dynamic character-length chunks and registers file inside the workspace active index.</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded w-fit uppercase font-bold">GET /api/analytics</p>
                    <p className="text-slate-400">Aggregates and delivers system logs, weekly chat trends, model tokens utilization history, and feedback ratios.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
