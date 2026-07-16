import React, { useState, useEffect, useRef } from 'react';
import { Chat, ChatMessage, PromptTemplate, Document } from '../types';
import {
  MessageSquare, Send, Bot, User, Pin, Trash2, Folder, Search, Mic, MicOff, Volume2, Copy, Download, Share2, ThumbsUp, ThumbsDown,
  ChevronRight, Sparkles, Sliders, PlayCircle, Eye, EyeOff, Paperclip, HelpCircle, FileText, CheckCircle, Info, Bookmark, RefreshCw, X
} from 'lucide-react';
import Markdown from 'react-markdown';

interface ChatInterfaceProps {
  chats: Chat[];
  prompts: PromptTemplate[];
  documents: Document[];
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
  onCreateChat: (title?: string, folder?: string | null) => Promise<string>;
  onUpdateChat: (id: string, updates: Partial<Chat>) => Promise<void>;
  onDeleteChat: (id: string) => Promise<void>;
  onSendMessage: (text: string, options: { model: string; systemPrompt: string; temperature: number; stream: boolean }) => Promise<void>;
  onSubmitFeedback: (chatId: string, messageId: string, rating: 'up' | 'down', text?: string) => Promise<void>;
  streamingText: string;
}

export default function ChatInterface({
  chats,
  prompts,
  documents,
  selectedChatId,
  onSelectChat,
  onCreateChat,
  onUpdateChat,
  onDeleteChat,
  onSendMessage,
  onSubmitFeedback,
  streamingText
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [useStream, setUseStream] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Feedback popup state
  const [feedbackPopup, setFeedbackPopup] = useState<{ msgId: string; rating: 'up' | 'down'; text: string } | null>(null);

  // Suggested starter queries
  const suggestions = [
    "What indemnification caps are inside our standard NDA?",
    "Review standard liability risks in NDAs.",
    "Draft a 2-sentence executive summary of our Q3 goals.",
    "Perform a quick code review for solid compliance."
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize browser speech recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setInputText(prev => prev + ' ' + text);
        setIsListening(false);
      };
      rec.onerror = () => {
        setIsListening(false);
      };
      rec.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = rec;
    }
  }, []);

  const activeChat = chats.find(c => c.id === selectedChatId) || null;

  // Scroll to bottom whenever messages or streaming updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages?.length, streamingText]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const messageToSend = inputText;
    setInputText('');

    const activePrompt = prompts.find(p => p.id === selectedPromptId);
    const systemPromptText = activePrompt ? activePrompt.systemPrompt : '';

    await onSendMessage(messageToSend, {
      model: selectedModel,
      systemPrompt: systemPromptText,
      temperature,
      stream: useStream
    });
  };

  const handleSpeechInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not fully supported in this browser version. Try opening in a new tab.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSpeechOutput = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Filter markdown characters out for cleaner speech
      const cleanText = text.replace(/[*#`_\-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 300)); // Limit to first 300 chars to avoid buffer bloat
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis text-to-speech is not supported in this browser environment.');
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Message copied to clipboard.');
  };

  const handleDownloadChat = () => {
    if (!activeChat) return;
    const formattedText = activeChat.messages
      .map(m => `[${m.role.toUpperCase()} - ${m.timestamp}]\n${m.text}\n`)
      .join('\n');
    const blob = new Blob([formattedText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${activeChat.title.replace(/\s+/g, '_')}_history.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleShareChat = () => {
    alert(`Dialogue Share URL copied to dashboard: ${window.location.href}#chat=${selectedChatId}`);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackPopup || !selectedChatId) return;
    await onSubmitFeedback(selectedChatId, feedbackPopup.msgId, feedbackPopup.rating, feedbackPopup.text);
    setFeedbackPopup(null);
  };

  // Group chats by Folders
  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const unpinnedChats = filteredChats.filter(c => !c.isPinned);

  // Group active RAG documents
  const activeRAGDocs = documents.filter(d => d.enabled && d.status === 'indexed');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[500px]" id="chat-interface">
      
      {/* 1. Left Sidebar: Sessions and Directory */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between h-full">
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Sessions Workspace</h3>
            <button
              onClick={() => onCreateChat()}
              className="px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold rounded-lg transition-all duration-150 cursor-pointer"
            >
              + New Chat
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat contents..."
              className="w-full bg-slate-950 border border-slate-850 text-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Chats Lists */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
            {/* Pinned Chats */}
            {pinnedChats.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-500 font-mono uppercase px-1">Pinned Sessions</p>
                {pinnedChats.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelectChat(c.id)}
                    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                      c.id === selectedChatId
                        ? 'bg-indigo-600/10 border border-indigo-500/30 text-slate-200'
                        : 'hover:bg-slate-950/50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Pin className="w-3 h-3 rotate-45 shrink-0 text-indigo-400" />
                      <span className="text-xs font-medium truncate">{c.title}</span>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateChat(c.id, { isPinned: false }); }}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* General Chats */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-slate-500 font-mono uppercase px-1">Recent Dialogues</p>
              {unpinnedChats.length === 0 && pinnedChats.length === 0 ? (
                <p className="text-[11px] text-slate-600 italic px-2 py-4">No active conversations match.</p>
              ) : (
                unpinnedChats.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelectChat(c.id)}
                    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                      c.id === selectedChatId
                        ? 'bg-indigo-600/10 border border-indigo-500/30 text-slate-200'
                        : 'hover:bg-slate-950/50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span className="text-xs font-medium truncate">{c.title}</span>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateChat(c.id, { isPinned: true }); }}
                        className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 cursor-pointer"
                        title="Pin chat"
                      >
                        <Pin className="w-3 h-3 rotate-45" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteChat(c.id); }}
                        className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Grounding Source Info Block */}
        <div className="mt-4 pt-4 border-t border-slate-850 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">RAG Grounding Index</span>
            <span className={`text-[9px] px-1.5 py-0.2 font-bold rounded-full ${activeRAGDocs.length > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-slate-850 text-slate-500'}`}>
              {activeRAGDocs.length > 0 ? 'Indexed' : 'Off'}
            </span>
          </div>
          <div className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-lg">
            <p className="text-[10px] text-slate-400 font-medium">
              {activeRAGDocs.length > 0
                ? `Referencing ${activeRAGDocs.length} custom document files to ground Gemini's text context.`
                : 'Upload or enable documents in the Document Hub to activate factual search grounding.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Canvas */}
      <div className="md:col-span-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex flex-col justify-between h-full overflow-hidden relative">
        
        {/* Chat Canvas Header */}
        <div className="bg-slate-900/60 border-b border-slate-800/80 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200">
                {activeChat ? activeChat.title : 'AI Co-Worker Agent'}
              </h3>
              <p className="text-[10px] font-mono text-slate-400">
                Model: <span className="text-indigo-400 font-semibold">{selectedModel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                showConfig ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-bold' : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
              title="Configure Model Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
            {activeChat && activeChat.messages.length > 0 && (
              <button
                onClick={handleDownloadChat}
                className="p-1.5 bg-slate-950/40 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-lg transition-all duration-200 cursor-pointer"
                title="Download conversation log"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2b. Expandable Model Settings Drawer */}
        {showConfig && (
          <div className="bg-slate-950 border-b border-slate-850 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 relative z-20">
            {/* System Prompt Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">System Agent Prompt Template</label>
              <select
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="">Default AI Assistant Persona</option>
                {prompts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Model Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Cognitive Reasoning Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Instant, low latency)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep logic, complex schemas)</option>
              </select>
            </div>

            {/* Temperature Sliders */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Temperature Variance</span>
                <span className="font-mono text-indigo-400">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 2c. Message Streams Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {!activeChat || activeChat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-lg mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="p-4 bg-slate-900/80 border border-indigo-500/20 text-indigo-400 rounded-2xl relative">
                  <Bot className="w-12 h-12 stroke-[1.5]" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-200">Initiate Corporate Consultation</h4>
                <p className="text-xs text-slate-500">
                  Select a template, customize parameters, or type a query. You can ask general questions or ground outputs using indexed knowledge base records.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-4">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(s)}
                    className="p-3 bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-indigo-500/40 text-left text-slate-400 hover:text-slate-200 rounded-xl transition-all duration-200 text-xs cursor-pointer font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {activeChat.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3.5 max-w-4xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-xl shrink-0 h-fit ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-indigo-400'}`}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className="space-y-1">
                    <div className={`rounded-2xl px-4 py-3 border text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600/10 border-indigo-500/20 text-slate-100'
                        : 'bg-slate-950/30 border-slate-850/80 text-slate-300'
                    }`}>
                      <div className="markdown-body">
                        <Markdown>{m.text}</Markdown>
                      </div>

                      {/* Display Grounded Citations inside the bubble if present */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-850 space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Retrieved Citations:</p>
                          <div className="space-y-1">
                            {m.citations.map((c, idx) => (
                              <div key={idx} className="bg-slate-950/60 p-2 rounded border border-slate-900 text-[10px] text-slate-400 flex items-start gap-2">
                                <Bookmark className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400" />
                                <div>
                                  <span className="font-bold text-slate-300">[{idx + 1}] {c.documentName}: </span>
                                  <span>"{c.snippet}"</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions row */}
                    <div className="flex items-center gap-3 px-1 text-[10px] text-slate-500 font-mono">
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {m.role === 'assistant' && (
                        <>
                          <span>•</span>
                          <span>{m.modelUsed || 'gemini-3.5-flash'}</span>
                          <span>•</span>
                          <span>{m.tokensUsed || 0} tokens</span>
                          <span>•</span>
                          <button
                            onClick={() => handleCopyText(m.text)}
                            className="hover:text-slate-300 flex items-center gap-1 transition-colors duration-150 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => handleSpeechOutput(m.text)}
                            className="hover:text-slate-300 flex items-center gap-1 transition-colors duration-150 cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" /> Speak
                          </button>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setFeedbackPopup({ msgId: m.id, rating: 'up', text: m.feedbackText || '' })}
                              className={`p-0.5 rounded transition-all duration-150 cursor-pointer ${m.rating === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-slate-300'}`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setFeedbackPopup({ msgId: m.id, rating: 'down', text: m.feedbackText || '' })}
                              className={`p-0.5 rounded transition-all duration-150 cursor-pointer ${m.rating === 'down' ? 'text-rose-400 bg-rose-500/10' : 'hover:text-slate-300'}`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming AI Chunk effect */}
              {streamingText && (
                <div className="flex gap-3.5 max-w-4xl mr-auto">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 shrink-0 h-fit">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="rounded-2xl px-4 py-3 bg-slate-950/30 border border-slate-850/80 text-xs text-slate-300 leading-relaxed">
                      <div className="markdown-body">
                        <Markdown>{streamingText}</Markdown>
                      </div>
                      <span className="inline-block w-1.5 h-3.5 bg-indigo-500 ml-1 animate-pulse"></span>
                    </div>
                    <div className="px-1 text-[10px] text-slate-500 font-mono">
                      <span>Generating stream chunks...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        {/* 2d. Chat Input Tray */}
        <div className="bg-slate-900/60 border-t border-slate-800/80 p-4 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Listening, speak clearly..." : "Ask your enterprise coworker, or lookup facts..."}
              disabled={isListening}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-4 pr-24 py-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />

            <div className="absolute right-3 flex items-center gap-1.5">
              {/* Voice Input */}
              <button
                type="button"
                onClick={handleSpeechInput}
                className={`p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
                  isListening ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={isListening ? "Stop listening" : "Speak to write"}
              >
                {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Submit Message */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-lg disabled:text-slate-400 transition-all duration-200 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
            <span>Press Enter to dispatch query</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${useStream ? 'bg-indigo-500' : 'bg-slate-700'}`}></span>
              <span>Streaming {useStream ? 'On' : 'Off'}</span>
            </span>
          </div>
        </div>

        {/* 3. Message Rating & Feedback Dialog Popup */}
        {feedbackPopup && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  {feedbackPopup.rating === 'up' ? <ThumbsUp className="w-4 h-4 text-emerald-400" /> : <ThumbsDown className="w-4 h-4 text-rose-400" />}
                  Submit AI Feedback review
                </h4>
                <button
                  onClick={() => setFeedbackPopup(null)}
                  className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Feedback Comment (Optional)</label>
                <textarea
                  rows={3}
                  value={feedbackPopup.text}
                  onChange={(e) => setFeedbackPopup({ ...feedbackPopup, text: e.target.value })}
                  placeholder="Help us improve. What was accurate or what did the model get wrong?"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setFeedbackPopup(null)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold rounded-lg hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
