import React, { useRef, useState, useEffect } from "react";
import vad from "voice-activity-detection";
import { uploadConversationChunk } from "./funtions"; // your API upload
import { KeywordPanel } from "./components/KeywordPanel";
import { Brain, Mic, MicOff, RotateCcw, Stethoscope } from "lucide-react";
import { ConversationPanel } from "./components/ConversationPanel";
import { TextArea } from "./components/TextArea";
import type { MedicalRecord } from "./types";

const MIN_CHUNK_DURATION = 5000; // 5s minimum

const VoiceRecognize: React.FC = () => {
  const [status, setStatus] = useState("Idle");
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord>({
    history: "",
    symptoms: "",
    prescription: "",
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const vadCleanupRef = useRef<(() => void) | null>(null);

  // tracking for minimum chunk
  const recordingStartTimeRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** Safe init VAD → always return cleanup function */
  const initVAD = (audioContext: AudioContext, stream: MediaStream, options: any) => {
    const controller = vad(audioContext, stream, options);
    return () => {
      if (!controller) return;
      if (typeof controller === "function") controller();
      else if (controller.destroy) controller.destroy();
      else if (controller.stop) controller.stop();
    };
  };

  /** Update text areas */
  const handleTextAreaChange = (field: keyof MedicalRecord, value: string) => {
    setMedicalRecord((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /** Full cleanup */
  const cleanupAll = () => {
    // clear timeouts
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    stopTimeoutRef.current = null;

    // VAD
    if (vadCleanupRef.current) {
      vadCleanupRef.current();
      vadCleanupRef.current = null;
    }

    // Recorder
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current = null;
    }

    // Mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    chunksRef.current = [];
    recordingStartTimeRef.current = null;
  };

  /** Start mic + VAD */
  const startVAD = async () => {
    try {
      if (status === "Listening…" || status === "Recording…") return;

      cleanupAll();

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
          recordingStartTimeRef.current = null;

          setAudioBlobs((prev) => [...prev, blob]);
          uploadConversationChunk(blob, setConversations)
            .then(() => console.log("📤 Chunk uploaded"))
            .catch((err) => console.error("Upload error:", err));
        }
      };

      // Setup VAD with cleanup
      const cleanup = initVAD(audioContext, stream, {
        onVoiceStart: () => {
          console.log("🎤 Voice started");
          if (mediaRecorder.state !== "recording") {
            mediaRecorder.start();
            recordingStartTimeRef.current = Date.now();
            setStatus("Recording…");
          }
          // if a stop timeout was pending, cancel it
          if (stopTimeoutRef.current) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
          }
        },
        onVoiceStop: () => {
          console.log("🤫 Voice stopped");
          // check elapsed time
          if (mediaRecorder.state === "recording") {
            const elapsed = Date.now() - (recordingStartTimeRef.current ?? 0);
            if (elapsed >= MIN_CHUNK_DURATION) {
              mediaRecorder.stop();
              setStatus("Listening…");
            } else {
              // wait remaining time then stop
              const remaining = MIN_CHUNK_DURATION - elapsed;
              stopTimeoutRef.current = setTimeout(() => {
                if (mediaRecorder.state === "recording") mediaRecorder.stop();
                stopTimeoutRef.current = null;
                setStatus("Listening…");
              }, remaining);
            }
          }
        },
        noiseCaptureDuration: 2000,
        minNoiseLevel: 0.3,
        voice_start: 150,
        voice_stop: 400,
        interval: 30,
      });

      vadCleanupRef.current = cleanup;
      setStatus("Listening…");
    } catch (err) {
      console.error("Microphone error:", err);
      setStatus("Mic error");
    }
  };

  /** Stop everything (Proceed button) */
  const stopAll = () => {
    console.log("🛑 Stopping all");
    setStatus("Idle");
    cleanupAll();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Medical Consultation Interface
              </h1>
              <p className="text-sm text-gray-600">
                Real-time conversation tracking & AI keyword extraction
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Medical Record */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Patient Documentation
              </h2>
              <div className="space-y-4">
                <TextArea
                  title="History"
                  value={medicalRecord.history}
                  onChange={(value) => handleTextAreaChange("history", value)}
                  placeholder="Enter patient medical history..."
                />
                <TextArea
                  title="Problem/Symptoms"
                  value={medicalRecord.symptoms}
                  onChange={(value) => handleTextAreaChange("symptoms", value)}
                  placeholder="Document current symptoms..."
                />
                <TextArea
                  title="Prescription Remarks"
                  value={medicalRecord.prescription}
                  onChange={(value) => handleTextAreaChange("prescription", value)}
                  placeholder="Add prescription notes..."
                />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <ConversationPanel
                conversations={conversations}
                isRecording={status === "Recording…"}
              />

              {/* Controls */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  {/* Start / Recording */}
                  <button
                    onClick={startVAD}
                    disabled={status === "Listening…" || status === "Recording…"}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      status === "Recording…"
                        ? "bg-red-100 text-red-600 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg transform hover:scale-105"
                    }`}
                  >
                    {status === "Recording…" ? <MicOff size={20} /> : <Mic size={20} />}
                    <span>
                      {status === "Recording…" ? "Recording..." : "Start"}
                    </span>
                  </button>

                  {/* Stop / Process */}
                  <button
                    onClick={stopAll}
                    disabled={status === "Idle"}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      status === "Idle"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg transform hover:scale-105"
                    }`}
                  >
                    <Brain
                      size={20}
                      className={status === "Listening…" ? "animate-pulse" : ""}
                    />
                    <span>Proceed / Stop</span>
                  </button>
                </div>

                <button
                  onClick={cleanupAll}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw size={16} />
                  <span className="text-sm">Reset All</span>
                </button>
              </div>

              {/* Recorded clips */}
              <div className="mt-4">
                <h3 className="font-semibold">Recorded Audio Chunks:</h3>
                <ul>
                  {audioBlobs.length === 0 && <p>No recordings yet.</p>}
                  {audioBlobs.map((blob, index) => (
                    <li key={index} className="mb-2">
                      <audio controls src={URL.createObjectURL(blob)} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <KeywordPanel keywords={[]} onKeywordClick={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecognize;
