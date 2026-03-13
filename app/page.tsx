'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, MessageSquare, Plus, X, Search,
  PanelLeftClose, PanelLeftOpen, Send, Loader2, Sparkles,
  AlignLeft, Terminal, FileCode, Check, Trash2, Edit3
} from 'lucide-react';

// --- Types ---
type Source = {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'markdown' | 'url';
};

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

type CommandAction = {
  id: string;
  title: string;
  icon: React.ElementType;
  action: () => void;
};

// --- Main Component ---
export default function ContextEngine() {
  // State
  const [sources, setSources] = useState<Source[]>([]);
  const [editorContent, setEditorContent] = useState<string>('# Untitled Document\n\nStart typing here...');
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hello! I am your Context Engine. Add some sources to the left, and I will use them to answer your questions or help you draft content.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Cmd+K Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsAddSourceOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus command input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => commandInputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // --- Gemini Integration ---
  const getGeminiClient = () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key is missing.');
    return new GoogleGenAI({ apiKey });
  };

  const buildSystemInstruction = () => {
    if (sources.length === 0) return "You are a helpful AI assistant.";
    
    let instruction = "You are an expert AI assistant acting as a 'Context Engine'. You have access to the following user-provided sources. ALWAYS use these sources to inform your answers. If the answer is not in the sources, say so, but try to be helpful.\n\n";
    
    sources.forEach((s, i) => {
      instruction += `--- SOURCE ${i + 1}: ${s.title} ---\n${s.content}\n\n`;
    });
    
    return instruction;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const ai = getGeminiClient();
      const chat = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction: buildSystemInstruction(),
        }
      });

      // Replay history (excluding the very first welcome message if we want, but let's just send the new one for simplicity in MVP, or send history)
      // For a true chat, we'd pass history. The SDK handles history internally if we keep the `chat` instance, 
      // but since we recreate it, we should ideally pass history. For MVP, we'll just send the current message 
      // and rely on the system instruction for context.
      
      const response = await chat.sendMessage({ message: userMsg });
      
      setChatHistory((prev) => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text || 'No response.' 
      }]);
    } catch (error: any) {
      console.error('Chat Error:', error);
      setChatHistory((prev) => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: `Error: ${error.message}` 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const executeAICommand = async (prompt: string, actionType: 'append_editor' | 'replace_editor' | 'chat') => {
    setIsCommandPaletteOpen(false);
    setIsChatLoading(true);
    
    if (actionType === 'chat') {
      setChatHistory((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: prompt }]);
    }

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: buildSystemInstruction() + `\n\nCURRENT EDITOR CONTENT:\n${editorContent}`,
        }
      });

      const text = response.text || '';

      if (actionType === 'append_editor') {
        setEditorContent((prev) => prev + '\n\n' + text);
      } else if (actionType === 'replace_editor') {
        setEditorContent(text);
      } else {
        setChatHistory((prev) => [...prev, { id: Date.now().toString(), role: 'model', text }]);
      }
    } catch (error: any) {
      console.error('Command Error:', error);
      alert(`Error executing command: ${error.message}`);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Actions ---
  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceTitle.trim() || !newSourceContent.trim()) return;
    
    const newSource: Source = {
      id: Date.now().toString(),
      title: newSourceTitle,
      content: newSourceContent,
      type: 'text'
    };
    
    setSources([...sources, newSource]);
    setNewSourceTitle('');
    setNewSourceContent('');
    setIsAddSourceOpen(false);
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const commands: CommandAction[] = [
    {
      id: 'summarize',
      title: 'Summarize All Sources',
      icon: AlignLeft,
      action: () => executeAICommand('Please provide a comprehensive summary of all the sources provided.', 'chat')
    },
    {
      id: 'draft_intro',
      title: 'Draft Intro in Editor',
      icon: Edit3,
      action: () => executeAICommand('Draft a compelling introduction based on the sources provided. Output ONLY the markdown text for the introduction.', 'append_editor')
    },
    {
      id: 'fix_grammar',
      title: 'Fix Grammar in Editor',
      icon: Sparkles,
      action: () => executeAICommand('Review the CURRENT EDITOR CONTENT for grammar, spelling, and clarity. Return the corrected markdown text. Do not add conversational filler, just return the corrected text.', 'replace_editor')
    },
    {
      id: 'explain_code',
      title: 'Explain Code (Chat)',
      icon: Terminal,
      action: () => executeAICommand('Explain the code or technical concepts present in the sources in simple terms.', 'chat')
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* --- Sidebar (Sources) --- */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 flex-shrink-0"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-white">
                <Database className="w-5 h-5 text-indigo-400" />
                <span>Context Sources</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sources.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8 px-4 border border-dashed border-slate-700 rounded-lg">
                  No sources added yet. Add a source to give the AI context.
                </div>
              ) : (
                sources.map((source) => (
                  <div key={source.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 group relative">
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-200 truncate">{source.title}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{source.content.length} chars</p>
                      </div>
                      <button 
                        onClick={() => removeSource(source.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800">
              <button 
                onClick={() => setIsAddSourceOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Source
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Main Workspace --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
            <h1 className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Context Engine
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs text-slate-500 font-medium">
              <Search className="w-3.5 h-3.5" />
              <span>Cmd + K</span>
            </div>
          </div>
        </header>

        {/* Split Pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Editor */}
          <div className="flex-1 flex flex-col border-r border-slate-200 bg-white min-w-0">
            <div className="h-10 border-b border-slate-100 flex items-center px-4 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Output Document
              </span>
            </div>
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="flex-1 w-full p-6 resize-none focus:outline-none text-slate-700 font-mono text-sm leading-relaxed"
              placeholder="Start typing your document here..."
            />
          </div>

          {/* Right: Chat */}
          <div className="flex-1 flex flex-col bg-slate-50 min-w-0 md:max-w-lg lg:max-w-xl">
            <div className="h-10 border-b border-slate-200 flex items-center px-4 bg-white">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Assistant
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100">
                        <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your sources..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-sm"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="absolute right-2 p-2 text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-500 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      
      {/* Command Palette Modal */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsCommandPaletteOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[60vh]"
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  ref={commandInputRef}
                  type="text" 
                  placeholder="Type a command or search..." 
                  className="flex-1 bg-transparent border-none focus:outline-none text-slate-800 placeholder:text-slate-400"
                />
                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">ESC</div>
              </div>
              <div className="p-2 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">AI Actions</div>
                {commands.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <cmd.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{cmd.title}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Source Modal */}
      <AnimatePresence>
        {isAddSourceOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsAddSourceOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-500" /> Add Context Source
                </h2>
                <button onClick={() => setIsAddSourceOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddSource} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source Title</label>
                  <input 
                    type="text" 
                    required
                    value={newSourceTitle}
                    onChange={(e) => setNewSourceTitle(e.target.value)}
                    placeholder="e.g., Next.js App Router Docs" 
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content (Text or Markdown)</label>
                  <textarea 
                    required
                    value={newSourceContent}
                    onChange={(e) => setNewSourceContent(e.target.value)}
                    placeholder="Paste your transcript, documentation, or notes here..." 
                    className="w-full h-64 px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddSourceOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save Source
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

// Simple Database icon component since it wasn't imported from lucide-react in the main list
function Database(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
