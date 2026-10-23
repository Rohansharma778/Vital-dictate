import React from 'react';
import { Mic, Square, Trash2, Save, FileText, Activity, Sparkles } from 'lucide-react';

const LiveTranscription = ({ transcript, isRecording, onStart, onStop, onProcess, onClear, onSave }) => {
  const wordCount = transcript.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-6 text-indigo-600">
        <Mic size={24} />
        <h2 className="text-xl font-bold">Live Medical Transcription</h2>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={onStart}
          disabled={isRecording}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${isRecording ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          <Mic size={16} /> Start Mic
        </button>
        <button 
          onClick={onStop}
          disabled={!isRecording}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${!isRecording ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-white text-red-500 border border-red-200 hover:bg-red-50'}`}
        >
          <Square size={16} /> Stop
        </button>
        <button onClick={onClear} className="flex items-center gap-2 bg-white text-gray-500 border border-gray-200 px-4 py-2 rounded-full font-medium hover:bg-gray-50 transition-colors">
          <Trash2 size={16} /> Clear
        </button>
        <button onClick={onSave} className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-4 py-2 rounded-full font-medium hover:bg-emerald-50 transition-colors">
          <Save size={16} /> Save Recording
        </button>
      </div>

      <div className="flex gap-6 mb-4 text-sm font-semibold text-gray-400">
        <div className="flex items-center gap-2"><FileText size={16}/> WORDS: {wordCount}</div>
        <div className="flex items-center gap-2"><Activity size={16}/> STATUS: {isRecording ? "Listening..." : "Stopped"}</div>
      </div>

      <div className="flex flex-col gap-4 flex-grow mb-6">
        <div className="bg-gray-50 rounded-lg p-4 h-[300px] border border-gray-100 overflow-y-auto whitespace-pre-wrap">
          {transcript || <span className="text-gray-400">Live text will appear here...</span>}
        </div>
      </div>

      <button 
        onClick={onProcess}
        className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white py-3 rounded-lg font-bold hover:bg-indigo-600 transition-colors"
      >
        <Sparkles size={18} /> Process Transcript with AI
      </button>
    </div>
  );
};

export default LiveTranscription;