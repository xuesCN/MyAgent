import React from 'react';
import { Bot } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const QUICK_PROMPTS = [
  { text: '你好，请介绍一下自己', desc: '了解AI助手' },
  { text: '今天天气怎么样', desc: '日常对话示例' },
  { text: '请解释一下量子计算', desc: '科技知识问答' },
  { text: '帮我写一段Python代码', desc: '编程助手' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
}) => {
  return (
    <div className="flex h-full items-center justify-center px-4 py-6 sm:px-8">
      <div className="w-full max-w-4xl">
        <div className="mx-auto rounded-2xl border border-slate-700/70 bg-slate-900/55 px-6 py-10 text-center shadow-[0_12px_36px_rgba(2,6,23,0.4)] backdrop-blur-sm sm:px-10">
      {/* Logo 和欢迎动画 */}
      <div className="relative mb-7 inline-block">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 p-1">
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-900">
            <Bot className="h-10 w-10 text-cyan-300" />
          </div>
        </div>
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
        </div>
      </div>

      {/* 欢迎文案 */}
      <h2 className="mb-3 text-3xl font-semibold text-slate-100 sm:text-4xl">
        AI Agent 智能助手
      </h2>
      <p className="mx-auto mb-8 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
        基于火山云LLM的强大AI助手，为您提供智能对话体验。
        开始对话，探索无限可能。
      </p>

      {/* 快速开始按钮 */}
      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.text)}
            className="rounded-xl border border-slate-700/80 bg-slate-800/45 p-4 text-left transition hover:border-cyan-400/60 hover:bg-slate-800/80"
          >
            <div className="text-sm font-medium text-slate-100">{item.text}</div>
            <div className="mt-1 text-xs text-slate-400">{item.desc}</div>
          </button>
        ))}
      </div>
        </div>
      </div>
    </div>
  );
};
