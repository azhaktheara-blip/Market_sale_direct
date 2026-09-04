import React, { useState } from 'react';
import {
  Mic,
  Camera,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Bot,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageGrader } from './ImageGrader';
import { PredictionDashboard } from './PredictionDashboard';
import { fastapiAiApi } from '../../api/fastapiAi';

export const FarmerAIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'voice' | 'vision' | 'predictions' | 'assistant'>('voice');

  // Interactive AI Agronomist State (Bonus Feature)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        'ជម្រាបសួរកសិករ! (Hello Farmer!) I am your FarmerDirect AI Agricultural Advisor. How can I help you with crop disease identification, weather adjustments, or direct market selling today?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendChat = async (messageToSend?: string) => {
    const text = messageToSend || chatInput;
    if (!text.trim() || isChatLoading) return;

    const newMessages = [...chatMessages, { role: 'user' as const, content: text }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fastapiAiApi.sendAgriChatMessage(
        text,
        newMessages.map((m) => ({ role: m.role, content: m.content }))
      );
      setChatMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'សូមអភ័យទោស! System notice: Unable to reach AI chat service. Please check your backend connection.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Center Tabs */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-stone-200 shadow-soft">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'voice'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>1. Voice Inventory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vision')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'vision'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>2. Vision Grader</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'predictions'
                ? 'bg-forest-900 text-white shadow-md shadow-forest-950/30'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>3. AI Predictions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'assistant'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30 font-extrabold'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>4. Agri-AI Bot</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'voice' && <VoiceRecorder />}
        {activeTab === 'vision' && <ImageGrader />}
        {activeTab === 'predictions' && <PredictionDashboard />}

        {/* Bonus Feature: Interactive AI Agronomist Chatbot */}
        {activeTab === 'assistant' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-stone-900 font-display flex items-center gap-2">
                    <span>FarmBot • Cambodian Agricultural Extension Officer</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Bilingual (Khmer & English)
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Get instant guidance on organic pest control, raised bed preparation, monsoon drainage, and wholesale market pricing.
                  </p>
                </div>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="h-80 sm:h-96 overflow-y-auto space-y-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-forest-800 text-white rounded-tr-none shadow-sm'
                        : 'bg-white text-stone-800 rounded-tl-none border border-stone-200 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-sm flex items-center gap-2 text-xs text-stone-500">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span>FarmBot is analyzing agricultural data...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Question Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-stone-400">Try Asking:</span>
              {[
                'តើគួរការពារដង្កូវលើដំណាំប៉េងប៉ោះយ៉ាងដូចម្តេច? (Tomato caterpillar defense)',
                'How to protect root vegetables before heavy rain?',
                'Best organic compost formula for sandy loam soil',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChat(chip)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-stone-900 text-xs font-semibold transition-colors border border-stone-200 text-left"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask FarmBot in Khmer or English (e.g. របៀបថែទាំដំណាំពេលភ្លៀងធ្លាក់...)"
                className="flex-1 bg-stone-50 border border-stone-200 focus:bg-white focus:ring-2 focus:ring-amber-500 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerAIDashboard;

