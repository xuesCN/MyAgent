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
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      {/* Logo 和欢迎动画 */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-tech-blue to-tech-purple p-1">
          <div className="w-full h-full rounded-full bg-tech-dark flex items-center justify-center">
            <Bot className="w-10 h-10 text-tech-blue" />
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-tech-green rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      </div>

      {/* 欢迎文案 */}
      <h2 className="text-2xl font-bold text-gradient mb-2">
        AI Agent 智能助手
      </h2>
      <p className="text-gray-400 mb-8 max-w-md">
        基于火山云LLM的强大AI助手，为您提供智能对话体验。
        开始对话，探索无限可能。
      </p>

      {/* 快速开始按钮 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        {QUICK_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.text)}
            className="p-3 rounded-lg border border-gray-700 hover:border-tech-blue hover:bg-gray-800/50 transition-colors text-left"
          >
            <div className="text-sm font-medium text-white">{item.text}</div>
            <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
