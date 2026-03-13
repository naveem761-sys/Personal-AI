'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Database,
  Bot,
  User,
  LayoutTemplate,
  Code,
  UploadCloud,
  Globe,
  Smartphone,
  MessageSquare,
  Lock,
  RefreshCw,
  Eye,
  Edit3,
  BrainCircuit,
  Activity
} from 'lucide-react';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ${className}`}>
    {children}
  </div>
);

const FlowArrow = ({ direction = 'right', className = '' }: { direction?: 'right' | 'down' | 'up' | 'left', className?: string }) => {
  return (
    <div className={`flex items-center justify-center text-slate-400 ${className}`}>
      {direction === 'right' && <span className="text-xl font-bold">→</span>}
      {direction === 'down' && <span className="text-xl font-bold">↓</span>}
      {direction === 'up' && <span className="text-xl font-bold">↑</span>}
      {direction === 'left' && <span className="text-xl font-bold">←</span>}
    </div>
  );
};

const StepNode = ({ icon: Icon, title, subtitle, color = 'blue', className = '' }: { icon: any, title: string, subtitle?: string, color?: 'blue' | 'emerald' | 'amber' | 'slate' | 'indigo', className?: string }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200 shadow-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-200 shadow-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200 shadow-slate-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-indigo-100',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border shadow-sm text-center ${colorClasses[color]} min-w-[120px] ${className}`}
    >
      <Icon className="w-6 h-6 mb-2" />
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      {subtitle && <span className="text-[10px] opacity-80 mt-1 font-medium">{subtitle}</span>}
    </motion.div>
  );
};

export default function OpenBrainArchitecture() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900"
          >
            Open Brain System Architecture
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-3xl mx-auto font-medium"
          >
            A lightweight, &quot;Single Source of Truth&quot; model with no middleware, no sync layer, and no export layer between the AI and the human interface.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Initial Setup */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b-2 border-slate-200 pb-2 flex items-center gap-2">
              <User className="w-6 h-6 text-amber-500" />
              Initial Setup (User Action)
            </h2>

            <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">1. Database & UI Generation</h3>
              <div className="flex flex-wrap items-center gap-2">
                <StepNode icon={Database} title="Create Table" subtitle="Supabase (Structured)" color="emerald" />
                <FlowArrow />
                <StepNode icon={Bot} title="Prompt AI" subtitle="Claude/ChatGPT" color="indigo" />
                <FlowArrow />
                <StepNode icon={LayoutTemplate} title="Iterate UI" subtitle="Preview" color="amber" />
                <FlowArrow />
                <StepNode icon={Code} title="Receive Code" subtitle="HTML/CSS/JS" color="slate" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">2. Web App Dashboard Creation</h3>
              <div className="flex flex-wrap items-center gap-2">
                <StepNode icon={UploadCloud} title="Upload Code" subtitle="To Vercel" color="blue" />
                <FlowArrow />
                <StepNode icon={Globe} title="Vercel Hosting" subtitle="Deployment" color="slate" />
                <FlowArrow />
                <StepNode icon={LayoutTemplate} title="Live URL" subtitle="Receive Link" color="emerald" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">3. Deployment & Access</h3>
              <div className="flex flex-wrap items-center gap-2">
                <StepNode icon={Globe} title="Live URL" color="emerald" />
                <FlowArrow />
                <StepNode icon={Smartphone} title="Bookmark" subtitle="Phone/Device" color="amber" />
                <FlowArrow />
                <StepNode icon={LayoutTemplate} title="Dashboard" subtitle="Native-like App" color="blue" />
              </div>
            </Card>
          </div>

          {/* Right Column: Dynamic Operation */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b-2 border-slate-200 pb-2 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Dynamic Operation
            </h2>

            <div className="relative p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -mr-48 -mt-48 opacity-60 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl -ml-48 -mb-48 opacity-60 pointer-events-none"></div>

              {/* Top Section: AI Flow */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12 relative z-10">
                <div className="flex flex-col items-center w-full md:w-auto">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Human Input</h4>
                  <StepNode icon={MessageSquare} title="Chat Interface" subtitle="Text Input" color="amber" className="w-full md:w-auto" />
                </div>
                
                <FlowArrow direction="right" className="hidden md:flex" />
                <FlowArrow direction="down" className="md:hidden my-2" />
                
                <div className="flex flex-col items-center w-full md:w-auto">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">AI Processing</h4>
                  <StepNode icon={BrainCircuit} title="AI Agent" subtitle="Claude/ChatGPT/Open Claw" color="indigo" className="w-full md:w-auto" />
                </div>
                
                <FlowArrow direction="right" className="hidden md:flex" />
                <FlowArrow direction="down" className="md:hidden my-2" />
                
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center md:text-left">Background Tasks</h4>
                  <div className="bg-slate-50 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 flex items-center gap-2 shadow-sm">
                    <Eye className="w-4 h-4 text-indigo-500" /> Pattern Recognition
                  </div>
                  <div className="bg-slate-50 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 flex items-center gap-2 shadow-sm">
                    <Activity className="w-4 h-4 text-emerald-500" /> Autonomous Monitoring
                  </div>
                </div>
              </div>

              {/* Center Section: Database & MCP */}
              <div className="flex flex-col items-center justify-center relative z-10 my-12">
                <div className="flex flex-col items-center mb-6 relative">
                  <div className="absolute inset-0 bg-emerald-100 blur-xl rounded-full opacity-50"></div>
                  <div className="relative flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg border border-slate-700 z-10">
                    <Lock className="w-5 h-5 text-emerald-400" />
                    MCP Server (Secure Bridge)
                  </div>
                  
                  <div className="flex justify-between w-48 text-slate-500 font-bold my-4 relative z-10">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-wider">Query</span>
                      <span className="text-xl">↓</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xl">↑</span>
                      <span className="text-[10px] uppercase tracking-wider">Write</span>
                    </div>
                  </div>
                </div>

                <motion.div 
                  animate={{ boxShadow: ['0px 0px 0px rgba(16, 185, 129, 0)', '0px 0px 30px rgba(16, 185, 129, 0.4)', '0px 0px 0px rgba(16, 185, 129, 0)'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-8 text-center max-w-md w-full shadow-xl relative z-20"
                >
                  <Database className="w-16 h-16 text-emerald-600 mx-auto mb-3 drop-shadow-sm" />
                  <h3 className="text-2xl font-extrabold text-emerald-900 tracking-tight">Supabase Database</h3>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-6 bg-emerald-100 inline-block px-3 py-1 rounded-full">&quot;Single Source of Truth&quot;</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                    <div className="bg-white border border-emerald-200 rounded-lg p-3 text-emerald-800 shadow-sm flex items-center justify-center">Household Info</div>
                    <div className="bg-white border border-emerald-200 rounded-lg p-3 text-emerald-800 shadow-sm flex items-center justify-center">Professional Relations</div>
                    <div className="bg-white border border-emerald-200 rounded-lg p-3 text-emerald-800 shadow-sm flex items-center justify-center">Job Hunt</div>
                    <div className="bg-white border border-emerald-200 rounded-lg p-3 text-emerald-800 shadow-sm flex items-center justify-center">Maintenance</div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom Section: Human UI Flow */}
              <div className="mt-16 relative z-10 bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h4 className="text-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Human Interaction Flow</h4>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                  <div className="flex flex-col items-center">
                    <div className="flex gap-4 mb-4 text-slate-400 font-bold">
                      <div className="flex flex-col items-center">
                        <span className="text-xl">↑</span>
                        <span className="text-[10px] uppercase tracking-wider">Fetches State</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider">Updates Data</span>
                        <span className="text-xl">↓</span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -top-3 -left-3 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full z-20 shadow-md uppercase tracking-wider">
                        Human Door
                      </div>
                      <StepNode icon={LayoutTemplate} title="Web App Dashboard" subtitle="Native-like Experience" color="blue" className="w-48" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 items-center">
                    <FlowArrow direction="right" className="hidden md:flex" />
                    <FlowArrow direction="down" className="md:hidden" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-white px-2 py-1 rounded border shadow-sm">Visualizes Data</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <StepNode icon={User} title="User Interaction" subtitle="Tap, Edit, View" color="amber" className="w-40" />
                  </div>
                </div>
              </div>
            </div>

            {/* Example Loop Card */}
            <Card className="bg-slate-900 text-white border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-700 pb-3">
                <RefreshCw className="w-5 h-5" />
                Example: Networking Loop
              </h3>
              <ol className="space-y-4 text-sm text-slate-300">
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">1</span>
                  <span className="pt-1">User texts <strong className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">&quot;Save new contact James&quot;</strong> to AI.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md">2</span>
                  <span className="pt-1">AI saves to Supabase database via MCP.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-md">3</span>
                  <span className="pt-1">Human opens Web App Dashboard on phone.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md">4</span>
                  <span className="pt-1">Human sees visual cue <strong className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">&quot;James going cold&quot;</strong>.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-md">5</span>
                  <span className="pt-1">Human edits status to <strong className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">&quot;Contacted&quot;</strong> in the app.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md">6</span>
                  <span className="pt-1">App updates Supabase; AI Agent is instantly informed for next chat.</span>
                </li>
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
