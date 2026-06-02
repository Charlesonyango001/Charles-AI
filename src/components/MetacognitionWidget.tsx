import React, { useState } from 'react';
import { Eye, Zap, Layers, Play, CheckCircle2, Award } from 'lucide-react';

interface MetacognitionData {
  knowledge: {
    selfAwareness: string;
    taskAwareness: string;
    strategicAwareness: string;
  };
  regulation: {
    plan: string;
    monitor: string;
    evaluation: string;
  };
}

export function MetacognitionWidget({ metacognition }: { metacognition: MetacognitionData }) {
  const [activeTab, setActiveTab] = useState<'awareness' | 'control'>('awareness');

  if (!metacognition || !metacognition.knowledge || !metacognition.regulation) return null;

  // Extract confidence rating or fallback safely
  const evalText = String(metacognition.regulation.evaluation || "");
  const pctMatch = evalText.match(/(\d+)%/);
  const confidencePercent = pctMatch ? Math.min(100, Math.max(0, parseInt(pctMatch[1], 10))) : 95;

  return (
    <div className="mt-4 border border-purple-500/10 bg-purple-950/5 rounded-2xl overflow-hidden font-sans text-left">
      {/* Header sections */}
      <div className="px-4 py-3 bg-purple-500/10 border-b border-purple-500/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-[8px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">
            Charles Metacognitive Stream
          </span>
        </div>
        
        {/* Compact Switcher */}
        <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('awareness')}
            className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'awareness'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/20 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pillar 1: Awareness
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('control')}
            className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'control'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/20 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pillar 2: Control
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      {activeTab === 'awareness' ? (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/40">
          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-purple-500/25 transition-all">
            <div className="flex items-center gap-1.5 mb-1.5 text-purple-400">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Self-Reflexive Knowledge</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
              {metacognition.knowledge.selfAwareness}
            </p>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-blue-500/25 transition-all">
            <div className="flex items-center gap-1.5 mb-1.5 text-blue-400">
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Task Parameters</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
              {metacognition.knowledge.taskAwareness}
            </p>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-pink-500/25 transition-all">
            <div className="flex items-center gap-1.5 mb-1.5 text-pink-400">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Strategic Selection</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
              {metacognition.knowledge.strategicAwareness}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/40">
          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-emerald-500/25 transition-all">
            <div className="flex items-center gap-1.5 mb-1.5 text-emerald-400">
              <Play className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Procedural Planning</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
              {metacognition.regulation.plan}
            </p>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-cyan-500/25 transition-all">
            <div className="flex items-center gap-1.5 mb-1.5 text-cyan-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Runtime Monitoring</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
              {metacognition.regulation.monitor}
            </p>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-amber-500/25 transition-all flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-amber-400">
                <Award className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Self-Critique & Evaluation</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
                {metacognition.regulation.evaluation}
              </p>
            </div>
            
            {/* Confidence index meter */}
            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                <span>Cognitive Confidence Index</span>
                <span className="text-emerald-400">{confidencePercent}%</span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1 my-1 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-emerald-400 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
