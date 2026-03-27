// EmrScreen.tsx
import React, { useRef, useState, useEffect } from "react";
import vad from "voice-activity-detection";
import { Mic, MicOff, Brain, RotateCcw, Stethoscope } from "lucide-react";
import { uploadConversationChunk, fetchemrdetails } from "./funtions";
// import { KeywordPanel } from "./Component";
import { TextArea } from "./components/TextArea";
import { ConversationPanel } from "./components/ConversationPanel";
import { createSpeechToText } from "./speechToText";

const EmrScreen: React.FC = () => {
  const [status, setStatus] = useState("Idle");
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [emrRecord, setEmrRecord] = useState({
    chiefComplaint: "",
    history: "",
    allergies: "",
    diagnosis: "",
    medicinePrescription: "",
    investigations: "",
    symptoms: "",
    prescription: "",
    actions:""
  });
//   const [keywords, setKeywords] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>(""); 
  const [liveText, setLiveText] = useState("");
  const [fullLiveText, setFullLiveText] = useState<String[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const vadCleanupRef = useRef<(() => void) | null>(null);
  const speechRef = useRef<any>(null);
  const isSpeechRunningRef = useRef(false);
  const speechStartRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    speechRef.current = createSpeechToText({
      onResult: (interim, final) => {
        setLiveText(interim);

        if (interim) {
          setConversations(prev => {
            const hasTempEntry = prev.some(item => item.isTemp);
            
            if (hasTempEntry) {
              return prev.map(item => 
                item.isTemp ? { ...item, text: interim } : item
              );
            } else {
              return [
                ...prev, 
                {
                  id: Date.now(),
                  speaker: 'doctor',
                  text: interim,
                  timestamp: new Date(),
                  isTemp: true
                }
              ];
            }
          });
        }

        if (final) {
          setFullLiveText(prev => [...prev, final]);
        
          setConversations(prev => {
            const filtered = prev.filter(item => !item.isTemp);
            return [
              ...filtered,
              {
                id: Date.now(),
                speaker: 'doctor',
                text: final,
                timestamp: new Date()
              }
            ];
          });
        }
      },
      onEnd: () => (isSpeechRunningRef.current = false),
      lang: "en-US",
    });
  }, []);

  // Start SpeechRecognition safely
  const handleStartSpeech = () => {
    if (!speechRef.current || isSpeechRunningRef.current) return;
    try {
      speechRef.current.start();
      isSpeechRunningRef.current = true;
    } catch (err) {
      console.warn("Speech recognition start error:", err);
    }
  };

  // Stop SpeechRecognition safely
  const handleStopSpeech = () => {
    if (!speechRef.current || !isSpeechRunningRef.current) return;
    try {
      speechRef.current.stop();
    } catch (err) {
      console.warn("Speech recognition stop error:", err);
    } finally {
      isSpeechRunningRef.current = false;
    }
  };

  const handleTextAreaChange = (field: string, value: string) => {
    setEmrRecord((prev) => ({ ...prev, [field]: value }));
  };

//   const handleAssignKeyword = (keyword: string, category: string) => {
//     setEmrRecord((prev) => ({
//       ...prev,
//       [category]: prev[category]
//         ? `${prev[category]}, ${keyword}`
//         : keyword,
//     }));
//   };

  const cleanupAll = () => {
    // Stop VAD
    if (vadCleanupRef.current) {
      try { vadCleanupRef.current(); } catch (e) { console.warn("VAD cleanup error:", e); }
      vadCleanupRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop();
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current = null;
    }

    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop SpeechRecognition
    handleStopSpeech();

    // Clear timers
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    speechStartRef.current = null;
    chunksRef.current = [];
    setStatus("Idle");
    setLiveText("");
    setSummary("");
  };

  const startVAD = async () => {
    if (status === "Listening…" || status === "Recording…") return;
    cleanupAll();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          chunksRef.current = [];
          setAudioBlobs((prev) => [...prev, blob]);
          handleStopSpeech();
        }
      };

      const controller = vad(audioContext, stream, {
        onVoiceStart: () => {
          setStatus("Recording…");
          if (!isSpeechRunningRef.current) handleStartSpeech();
          if (mediaRecorder.state !== "recording") mediaRecorder.start();
          speechStartRef.current = Date.now();
          if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
        },
        onVoiceStop: () => {
          setStatus("Silent");
          const elapsed = Date.now() - (speechStartRef.current ?? Date.now());
          const remaining = Math.max(0, 3000 - elapsed);
          stopTimeoutRef.current = setTimeout(() => {
            if (mediaRecorder.state === "recording") mediaRecorder.stop();
            speechStartRef.current = null;
          }, remaining);
        },
        noiseCaptureDuration: 100,
        minNoiseLevel: 1.5,
        voice_start: 80,
        voice_stop: 400,
        interval: 30,
      });

      if (typeof controller === "function") vadCleanupRef.current = controller;
      else if (controller && typeof controller.destroy === "function") vadCleanupRef.current = () => controller.destroy();
      else if (controller && typeof controller.stop === "function") vadCleanupRef.current = () => controller.stop();
      else vadCleanupRef.current = null;

      setStatus("Listening…");
    } catch (err) {
      console.error("Mic error:", err);
      setStatus("Mic error");
    }
  };

  const stopAll = () => {
    const conversationText = conversations
      .filter(conv => !conv.isTemp)
      .map(c => c.text)
      .join(" ");
    
    // Update fetchemrdetails to handle the new API response structure
    fetchemrdetails(conversationText, setEmrRecord);
    
    cleanupAll();
  };

  useEffect(() => () => cleanupAll(), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Medical Consultation Interface</h1>
            <p className="text-sm text-gray-600">Real-time conversation tracking & AI keyword extraction</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            {/* <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Documentation</h2> */}
            <div className="space-y-4">
              <TextArea
                title="Chief Complaint"
                value={emrRecord.chiefComplaint}
                onChange={(v) => handleTextAreaChange("chiefComplaint", v)}
                placeholder="Enter Chief complaints"
              />
              <TextArea
                title="History"
                value={emrRecord.history}
                onChange={(v) => handleTextAreaChange("history", v)}
                placeholder="Enter Patient history"
              />
              <TextArea
                title="Diagnosis"
                value={emrRecord.diagnosis}
                onChange={(v) => handleTextAreaChange("diagnosis", v)}
                placeholder="Enter Diagnosis Details"
              />
              <TextArea
                title="Medicine Prescription"
                value={emrRecord.medicinePrescription}
                onChange={(v) => handleTextAreaChange("medicinePrescription", v)}
                placeholder="Enter Medicine prescriptions"
              />
              <TextArea
                title="Investigations"
                value={emrRecord.investigations}
                onChange={(v) => handleTextAreaChange("investigations", v)}
                placeholder="Enter Required investigations"
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <ConversationPanel conversations={conversations} isRecording={status === "Recording…"} />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <TextArea
                title="Action Insights"
                value={emrRecord.actions}
                onChange={(v) => handleTextAreaChange("actions", v)}
                placeholder="Enter Action Insights "
              />
            <TextArea
                title="Allergies"
                value={emrRecord.allergies}
                onChange={(v) => handleTextAreaChange("allergies", v)}
                placeholder="Allergies if any..."
              />
            {/* Summary Section */}
            {summary && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <h3 className="font-semibold text-blue-800">Conversation Summary</h3>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-2" style={{display:"none"}}>Live Speech: {liveText}</p>
            <p className="text-xs text-gray-600 mt-4" style={{display:"none"}}>Full Text : {fullLiveText.join(", ")}</p>
            
            {/* Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={startVAD}
                  disabled={status === "Listening…" || status === "Recording…"}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg  ${status !== "Idle" ? 'bg-gray-300 text-slate-700 cursor-not-allowed' :'bg-red-500 text-white hover:bg-red-600 cursor-pointer'}`}
                >
                  {status === "Recording…" ? <MicOff size={20} /> : <Mic size={20} />}
                  <span>{status === "Recording…" ? "Recording..." : "Start"}</span>
                </button>

                <button
                  onClick={stopAll}
                  
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg ${status === "Idle" ? 'bg-gray-300 text-slate-700' :'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'}`}
                >
                  <Brain size={20} />
                  <span>Stop & Process</span>
                </button>
              </div>

              <button
                onClick={cleanupAll}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                <RotateCcw size={16} />
                <span className="text-sm">Reset All</span>
              </button>
            </div>

            {/* Recorded Clips */}
            <div className="mt-4">
                <h3 className="font-semibold">Recorded Audio Chunks:</h3>
                <ul>
                  {audioBlobs.length === 0 && <p>No recordings yet.</p>}
                  {audioBlobs.map((blob, idx) => (
                    <li key={idx} className="mb-2">
                      <audio controls src={URL.createObjectURL(blob)} />
                    </li>
                  ))}
                </ul>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200" >
            {/* <KeywordPanel keywords={keywords} onAssignKeyword={handleAssignKeyword} /> */}
            {/* <TextArea
                title=""
                value={emrRecord.actions}
                onChange={(v) => handleTextAreaChange("actions", v)}
                placeholder="Action Insights will appear here..."
              /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmrScreen;