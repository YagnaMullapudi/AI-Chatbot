import React, { useState, useRef } from 'react';
import { Document } from '../types';
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Database, FolderPlus, Sparkles, BookOpen } from 'lucide-react';

interface DocumentUploadViewProps {
  documents: Document[];
  onUpload: (name: string, content: string, size: number, type: string, category: string) => Promise<void>;
  onToggleEnabled: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function DocumentUploadView({ documents, onUpload, onToggleEnabled, onDelete }: DocumentUploadViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Enterprise Knowledge Base');
  const [customCategory, setCustomCategory] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Enterprise Knowledge Base',
    'Legal & NDA',
    'Finance & Growth',
    'HR & Onboarding',
    'Technical Documentation',
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      // Read text content
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = (e.target?.result as string) || '';
        const finalCategory = selectedCategory === 'Custom' ? (customCategory || 'Custom') : selectedCategory;
        await onUpload(file.name, content, file.size, file.type, finalCategory);
        setUploading(false);
        setCustomCategory('');
      };
      reader.onerror = () => {
        setUploadError('Failed to parse file content correctly.');
        setUploading(false);
      };
      reader.readAsText(file);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process document upload.');
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6" id="documents-view">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          RAG Document Hub & Indexer
        </h2>
        <p className="text-sm text-slate-400">
          Upload and index enterprise documentation. The chatbot automatically chunks and ground answers using active sources.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Index New Document
          </h3>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium">Workspace Classification Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="Custom">+ Create New Category</option>
            </select>
          </div>

          {selectedCategory === 'Custom' && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Custom Category Name</label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Sales Playbook"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Drag & Drop Stage */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`w-full min-h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all duration-200 cursor-pointer ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.csv,.md,.json,.html"
            />
            
            <UploadCloud className={`w-10 h-10 mb-3 transition-colors duration-200 ${dragActive ? 'text-indigo-400' : 'text-slate-500'}`} />
            
            <p className="text-xs text-slate-300 font-semibold mb-1">
              Drag & Drop file or <span className="text-indigo-400 hover:underline">Browse</span>
            </p>
            <p className="text-[10px] text-slate-500 max-w-[200px]">
              Supports TXT, CSV, MD, JSON, and HTML text payloads up to 10MB
            </p>

            {uploading && (
              <div className="mt-4 flex items-center gap-2 text-xs text-indigo-400">
                <span className="w-2.5 h-2.5 bg-indigo-500 animate-ping rounded-full"></span>
                <span>Indexing chunks, saving to RAG index...</span>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="flex items-start gap-2 p-3 bg-red-950/20 text-red-400 border border-red-900/30 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Document Directory */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Index Repository Directory
              </h3>
              <p className="text-xs text-slate-500">Enable or disable sources. Active files are included in AI grounding contexts.</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {documents.length} sources total
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-3">
              <FileText className="w-12 h-12 text-slate-600 stroke-[1.5]" />
              <div>
                <p className="text-sm font-medium">No knowledge sources indexed yet.</p>
                <p className="text-xs text-slate-600">Index documentation using the upload panel to connect RAG.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[350px] space-y-2 pr-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">{doc.name}</p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-500 font-medium">
                        <span className="text-slate-400 bg-slate-850 px-1.5 py-0.5 rounded font-semibold">{doc.category}</span>
                        <span>•</span>
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-semibold">{doc.chunkCount} document chunks</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                        {doc.enabled ? 'Enabled in RAG' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => onToggleEnabled(doc.id)}
                        className="text-slate-400 hover:text-slate-100 transition-colors duration-200 cursor-pointer"
                        title={doc.enabled ? 'Click to disable' : 'Click to enable'}
                      >
                        {doc.enabled ? (
                          <ToggleRight className="w-10 h-6 text-indigo-400" />
                        ) : (
                          <ToggleLeft className="w-10 h-6 text-slate-600" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => onDelete(doc.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200 cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
