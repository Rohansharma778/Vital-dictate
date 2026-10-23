import React, { useState, useRef } from 'react';
import LiveTranscription from './components/LiveTranscription';
import MedicalSummary from './components/MedicalSummary';
import { X } from 'lucide-react';

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summaryData, setSummaryData] = useState(null); // Will hold AI data later

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const startMic = async () => {
    setTranscript("");
    setIsRecording(true);

    wsRef.current = new WebSocket("ws://127.0.0.1:8000/ws/transcribe");

    wsRef.current.onopen = async () => {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      let pcmBuffer = [];
      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        let maxVol = 0;
        for (let i = 0; i < inputData.length; i++) {
          if (Math.abs(inputData[i]) > maxVol) maxVol = Math.abs(inputData[i]);
        }
        if (maxVol > 0.01) {
          // console.log("Audio detected! Max volume:", maxVol);
        }

        for (let i = 0; i < inputData.length; i++) {
          pcmBuffer.push(Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF);
        }
        // backend required 512 samples
        while (pcmBuffer.length >= 512) {
          const chunk = new Int16Array(pcmBuffer.slice(0, 512));
          pcmBuffer = pcmBuffer.slice(512);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(chunk.buffer);
          }
        }
      };
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    };

    wsRef.current.onmessage = (event) => {
      // console.log("Backend response:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.text) {
          setTranscript((prev) => prev + data.text + " ");
        }
        } catch (error) {
          console.error("Failed to parse backend data:", error);
      }
    };
  };

  const stopMic = () => {
    setIsRecording(false);
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
    if (processorRef.current) processorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (wsRef.current) wsRef.current.close();
  };

  const processTranscript = async () => {
    if (!transcript.trim()) return;
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim() })
      });
      const data = await response.json();
      setSummaryData(data.summary);
      // console.log("Summary received:", data.summary);
    } catch (error) {
      console.error("Error processing transcript:", error);
    }
  };
  const clearTranscript = () => {
    setTranscript("");
    setSummaryData(null);
  };

  const saveTranscript = () => {
    if (!transcript.trim()) return;
    const timestamp = new Date().toLocaleString();
    localStorage.setItem(`medical_session_${timestamp}`, JSON.stringify({
      transcript,
      summary: summaryData
    }));
    alert("Session saved to browser storage!");
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col lg:flex-row gap-6 font-sans">
      <LiveTranscription 
        transcript={transcript}
        isRecording={isRecording}
        onStart={startMic}
        onStop={stopMic}
        onProcess={processTranscript}
        onClear={clearTranscript}
        onSave={saveTranscript}
      />
      <MedicalSummary 
        summaryData={summaryData}
      />
    </div>
  );
};

export default App;