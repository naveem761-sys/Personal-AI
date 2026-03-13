'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Command } from 'cmdk';
import { ingestUrl } from './actions/ingest';

import {
  FileText, MessageSquare, Plus, X, Search,
  PanelLeftClose, PanelLeftOpen, Send, Loader2, Sparkles,
  AlignLeft, Terminal, FileCode, Check, Trash2, Edit3, Link as LinkIcon,
  GripVertical
} from 'lucide-react';

// --- Types ---
type Source = {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'markdown' | 'url';
  url?: string;
};

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

// --- Main Component ---
export default function ContextEngine() {
  // State
  const [sources, setSources] = useState<Source[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hello! I am your Context Engine. Add some sources to the left, and I will use them to answer your questions or help you draft content.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [sourceType, setSourceType] = useState<'text' | 'url'>('text');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tiptap Editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<h1>Untitled Document</h1><p>Start typing here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none',
      },
    },
  });

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Gemini Integration ---
  const getGeminiClient = () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key is missing.');
    return new GoogleGenAI({ apiKey });
  };

  const buildSystemInstruction = () => {
    let instruction = "You are an expert AI assistant acting as a 'Context Engine'. You have access to the following user-provided sources. ALWAYS use these sources to inform your answers. If the answer is not in the sources, say so, but try to be helpful.\n\n";
    
    if (sources.length > 0) {
      sources.forEach((s, i) => {
        instruction += `--- SOURCE ${i + 1}: ${s.title} ---\n${s.content}\n\n`;
      });
    } else {
      instruction += "No sources provided yet.\n\n";
    }
    
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
      
      // Include editor content context if they ask about it
      const editorContext = editor ? `\n\nCURRENT EDITOR CONTENT:\n${editor.getText()}` : '';
      
      const chat = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction: buildSystemInstruction() + editorContext,
        }
      });
      
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
      const editorContext = editor ? `\n\nCURRENT EDITOR CONTENT:\n${editor.getText()}` : '';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: buildSystemInstruction() + editorContext,
        }
      });

      const text = response.text || '';

      if (actionType === 'append_editor' && editor) {
        editor.commands.insertContent(`<p></p>${text.replace(/\n/g, '<br>')}`);
      } else if (actionType === 'replace_editor' && editor) {
        editor.commands.setContent(text.replace(/\n/g, '<br>'));
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
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sourceType === 'text') {
      if (!newSourceTitle.trim() || !newSourceContent.trim()) return;
      const newSource: Source = {
        id: Date.now().toString(),
        title: newSourceTitle,
        content: newSourceContent,
        type: 'text'
      };
      setSources([...sources, newSource]);
    } else if (sourceType === 'url') {
      if (!newSourceUrl.trim()) return;
      setIsIngesting(true);
      try {
        const result = await ingestUrl(newSourceUrl);
        if (result.success && result.content) {
          const newSource: Source = {
            id: Date.now().toString(),
            title: result.title || newSourceUrl,
            content: result.content,
            type: 'url',
            url: newSourceUrl
          };
          setSources([...sources, newSource]);
        } else {
          alert(`Failed to ingest URL: ${result.error}`);
        }
      } catch (error) {
        console.error(error);
        alert('Failed to ingest URL');
      } finally {
        setIsIngesting(false);
      }
    }
    
    setNewSourceTitle('');
    setNewSourceContent('');
    setNewSourceUrl('');
    setIsAddSourceOpen(false);
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const clearSession = () => {
    setChatHistory([{ id: '1', role: 'model', text: 'Session cleared. How can I help you now?' }]);
    setIsCommandPaletteOpen(false);
  };

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
                      {source.type === 'url' ? (
                        <LinkIcon className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      )}
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
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 transition-colors rounded-md border border-slate-200 text-xs text-slate-500 font-medium"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cmd + K</span>
            </button>
          </div>
        </header>

        {/* Split Pane using react-resizable-panels */}
        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* Left: Editor */}
            <Panel defaultSize={60} minSize={30}>
              <div className="h-full flex flex-col bg-white">
                <div className="h-10 border-b border-slate-100 flex items-center px-4 bg-slate-50/50 flex-shrink-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" /> Output Document
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-slate-100 hover:bg-indigo-100 transition-colors flex items-center justify-center cursor-col-resize border-x border-slate-200">
              <GripVertical className="w-4 h-4 text-slate-400" />
            </PanelResizeHandle>

            {/* Right: Chat */}
            <Panel defaultSize={40} minSize={25}>
              <div className="h-full flex flex-col bg-slate-50">
                <div className="h-10 border-b border-slate-200 flex items-center px-4 bg-white flex-shrink-0">
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

                <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
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
            </Panel>
          </PanelGroup>
        </div>
      </div>

      {/* --- Modals --- */}
      
      {/* Command Palette Modal (CMDK) */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsCommandPaletteOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="pointer-events-auto w-full max-w-2xl px-4"
              >
                <Command className="shadow-2xl border border-slate-200 rounded-xl overflow-hidden bg-white" loop>
                  <Command.Input placeholder="Type a command or search..." autoFocus />
                  <Command.List>
                    <Command.Empty>No results found.</Command.Empty>
                    
                    <Command.Group heading="Context Actions">
                      <Command.Item onSelect={() => executeAICommand('Please provide a comprehensive summary of all the sources provided.', 'chat')}>
                        <AlignLeft className="w-4 h-4" />
                        /summarize (Summarize active sources)
                      </Command.Item>
                      <Command.Item onSelect={() => executeAICommand('Draft a compelling introduction or outline based on the sources provided. Output ONLY the markdown text.', 'append_editor')}>
                        <Edit3 className="w-4 h-4" />
                        /draft (Generate blog post outline in editor)
                      </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Editor Actions">
                      <Command.Item onSelect={() => executeAICommand('Review the CURRENT EDITOR CONTENT for grammar, spelling, and clarity. Return the corrected markdown text.', 'replace_editor')}>
                        <Sparkles className="w-4 h-4" />
                        /fix-grammar (Fix current editor content)
                      </Command.Item>
                    </Command.Group>

                    <Command.Group heading="System">
                      <Command.Item onSelect={clearSession}>
                        <Trash2 className="w-4 h-4" />
                        /clear (Wipe current session context)
                      </Command.Item>
                    </Command.Group>
                  </Command.List>
                </Command>
              </motion.div>
            </div>
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
                
                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSourceType('text')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${sourceType === 'text' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Raw Text / Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('url')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${sourceType === 'url' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    URL Scraper
                  </button>
                </div>

                {sourceType === 'text' ? (
                  <>
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
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                    <input 
                      type="url" 
                      required
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://example.com/article" 
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      We will scrape the main text content from this URL to use as context.
                    </p>
                  </div>
                )}

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
                    disabled={isIngesting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    {isIngesting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Scraping...</>
                    ) : (
                      <><Check className="w-4 h-4" /> Save Source</>
                    )}
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
