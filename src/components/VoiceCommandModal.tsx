import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import {
  parseVoiceCommand,
  SAMPLE_VOICE_COMMANDS,
  type VoiceCommandAction,
} from '../utils/voiceCommandEngine';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (action: VoiceCommandAction, rawText: string) => void;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micPermissionMsg, setMicPermissionMsg] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<{ stop?: () => void } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      setMicPermissionMsg(null);
      setLastFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runCommandText = (rawText: string) => {
    const clean = rawText.trim();
    if (!clean) return;
    const action = parseVoiceCommand(clean);
    setLastFeedback(action.feedbackTr);
    onExecuteCommand(action, clean);
  };

  const handleToggleListening = async () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    setMicPermissionMsg(null);

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      setMicPermissionMsg(
        'Mikrofon izni verilmedi veya cihazda mikrofon bulunamadı. Aşağıdaki komut kutusundan veya hazır sesli komutlardan doğrudan çalıştırabilirsiniz.'
      );
      return;
    }

    const SpeechRec =
      (
        window as unknown as {
          SpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            maxAlternatives: number;
            onstart: () => void;
            onresult: (e: {
              results: { [k: number]: { transcript: string }[] };
            }) => void;
            onend: () => void;
            onerror: () => void;
            start: () => void;
            stop: () => void;
          };
          webkitSpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            maxAlternatives: number;
            onstart: () => void;
            onresult: (e: {
              results: { [k: number]: { transcript: string }[] };
            }) => void;
            onend: () => void;
            onerror: () => void;
            start: () => void;
            stop: () => void;
          };
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            maxAlternatives: number;
            onstart: () => void;
            onresult: (e: {
              results: { [k: number]: { transcript: string }[] };
            }) => void;
            onend: () => void;
            onerror: () => void;
            start: () => void;
            stop: () => void;
          };
        }
      ).webkitSpeechRecognition;

    if (!SpeechRec) {
      setMicPermissionMsg(
        'Tarayıcı konuşma tanıma API’si hazır değil; mikrofon izniniz doğrulandı. Komutunuzu aşağıya yazıp çalıştırabilirsiniz.'
      );
      return;
    }

    const rec = new SpeechRec();
    rec.lang = 'tr-TR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      setIsListening(true);
      setLastFeedback('Dinleniyor... Doğal dil komutunuzu söyleyin.');
    };
    rec.onresult = (ev) => {
      const spoken = ev.results?.[0]?.[0]?.transcript || '';
      if (spoken.trim()) {
        setCommandInput(spoken);
        runCommandText(spoken);
      }
    };
    rec.onend = () => {
      setIsListening(false);
    };
    rec.onerror = () => {
      setIsListening(false);
      setMicPermissionMsg(
        'Ses algılanamadı. Tekrar deneyin veya aşağıdaki hızlı komutları kullanın.'
      );
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommandText(commandInput);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sesli Komut Modu"
      data-testid="voice-command-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#1e1f24] rounded-3xl p-5 sm:p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5 text-neutral-900 dark:text-neutral-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Sesli Komut Modu (Voice Command Mode)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Türkçe veya İngilizce doğal dil komutlarıyla tema, proje, model, kitaplık ve CMS’yi yönetin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sesli Komut Penceresini Kapat"
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Microphone Action Card */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-neutral-900 dark:text-white">
              {isListening
                ? 'Mikrofon Aktif — Komutunuz Dinleniyor...'
                : 'Doğal Dil Ses Algılama'}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Örnek: &ldquo;Switch to Dark Mode&rdquo;, &ldquo;Start a new project&rdquo;, &ldquo;Show me my library&rdquo;
            </div>
          </div>

          <button
            type="button"
            data-testid="voice-command-mic-btn"
            onClick={handleToggleListening}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Dinlemeyi Durdur</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Mikrofonla Komut Ver</span>
              </>
            )}
          </button>
        </div>

        {/* Manual / Fallback Command Input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <label
            htmlFor="voice-command-input"
            className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
          >
            Doğal Dil Komut Satırı (Ses veya Yazı)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="voice-command-input"
              data-testid="voice-command-input"
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder='Örn: "Switch to Dark Mode", "Start a new project", "Show me my library"'
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            />
            <button
              type="submit"
              data-testid="voice-command-run-btn"
              className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Çalıştır</span>
            </button>
          </div>
        </form>

        {micPermissionMsg && (
          <p
            role="status"
            className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200"
          >
            {micPermissionMsg}
          </p>
        )}

        {lastFeedback && (
          <div
            role="status"
            data-testid="voice-command-feedback"
            className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{lastFeedback}</span>
          </div>
        )}

        {/* Clickable Sample Voice Commands */}
        <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Hızlı Sesli Komut Örnekleri (Tek Tıkla Dene)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_VOICE_COMMANDS.map((sample) => (
              <button
                key={sample.command}
                type="button"
                data-testid={`sample-cmd-${sample.command
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')}`}
                onClick={() => {
                  setCommandInput(sample.command);
                  runCommandText(sample.command);
                }}
                className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#141518] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800 text-left transition cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                    &ldquo;{sample.command}&rdquo;
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {sample.category} · {sample.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
