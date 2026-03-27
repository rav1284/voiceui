export const createSpeechToText = ({ onResult, onEnd, lang }) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) throw new Error("SpeechRecognition not supported");

  const recognition = new SpeechRecognition();
  recognition.lang = lang || "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript + " ";
      } else {
        interim += transcript + " ";
      }
    }
    onResult?.(interim.trim(), final.trim());
  };

  recognition.onend = () => onEnd?.();

  return recognition;
};