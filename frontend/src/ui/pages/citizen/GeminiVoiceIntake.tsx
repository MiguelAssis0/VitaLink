import type { FunctionCall, Session } from "@google/genai";
import { useEffect, useRef, useState } from "react";
import {
  createEmergency,
  getGeminiLiveToken,
  updateEmergencyVoiceSummary,
  type Emergency,
} from "../../../api";
import "./GeminiVoiceIntake.css";

const instructions =
  "Você é a atendente de voz do VitaLink, um protótipo de simulação. Fale em português do Brasil, com calma e frases curtas. Diga que esta conversa é simulada e que uma emergência real exige ligar 192. Colete apenas o que a pessoa relata e o local; não faça diagnóstico, não classifique gravidade e não recomende tratamento. Faça uma pergunta de cada vez. Assim que houver informação nova útil, chame update_emergency_summary com um resumo factual curto para a equipe. Nunca diga que uma equipe real foi acionada.";
type LocationPayload = {
  location: {
    source: "MANUAL" | "BROWSER";
    address: string;
    reference: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  };
  notes: string;
};

export function GeminiVoiceIntake({
  payload,
  confirmed,
  created,
  onCreated,
}: {
  payload: LocationPayload;
  confirmed: boolean;
  created: Emergency | null;
  onCreated: (request: Emergency) => void;
}) {
  const [request, setRequest] = useState<Emergency | null>(null);
  const [status, setStatus] = useState("Pronto para iniciar");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const session = useRef<Session | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const processor = useRef<ScriptProcessorNode | null>(null);
  const dispatcherConnected = useRef(false);
  const outputSources = useRef(new Set<AudioBufferSourceNode>());
  const nextOutputTime = useRef(0);

  useEffect(() => {
    if (created) setRequest(created);
  }, [created]);

  function stopOutput() {
    outputSources.current.forEach((source) => {
      try {
        source.stop();
      } catch { }
    });
    outputSources.current.clear();
    if (context.current) nextOutputTime.current = context.current.currentTime;
  }

  function cleanup() {
    if (processor.current) processor.current.onaudioprocess = null;
    processor.current?.disconnect();
    session.current?.close();
    stream.current?.getTracks().forEach((track) => track.stop());
    void context.current?.close().catch(() => { });
    processor.current = null;
    session.current = null;
    stream.current = null;
    context.current = null;
    outputSources.current.clear();
    dispatcherConnected.current = false;
  }

  useEffect(() => {
    const joined = () => {
      dispatcherConnected.current = true;
      stopOutput();
      setStatus("Central conectada; IA acompanha e atualiza a equipe");
    };
    const left = () => {
      dispatcherConnected.current = false;
      setStatus("Conversa por voz com a IA em andamento");
    };
    window.addEventListener("vitalink:dispatcher-call-connected", joined);
    window.addEventListener("vitalink:dispatcher-call-ended", left);
    return () => {
      window.removeEventListener("vitalink:dispatcher-call-connected", joined);
      window.removeEventListener("vitalink:dispatcher-call-ended", left);
      cleanup();
    };
  }, []);

  async function start() {
    if (!confirmed) {
      setError("Confirme a simulação antes de iniciar a conversa.");
      return;
    }
    if (
      payload.location.source === "MANUAL" &&
      !payload.location.address.trim()
    ) {
      setError("Informe um endereço antes de iniciar.");
      return;
    }
    setBusy(true);
    setError("");
    let emergencyCreated: Emergency | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Este navegador não permite acesso ao microfone.");
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      stream.current = media;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      context.current = audioContext;
      await audioContext.resume();
      const { GoogleGenAI, Modality, Type } = await import("@google/genai");
      const token = await getGeminiLiveToken();
      emergencyCreated =
        created || (await createEmergency(payload, crypto.randomUUID()));
      setRequest(emergencyCreated);
      if (!created) onCreated(emergencyCreated);
      const updateTool = {
        name: "update_emergency_summary",
        description:
          "Atualize o resumo factual da ocorrência com informações novas que a pessoa acabou de falar. Não avalie gravidade nem recomende tratamento.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description:
                "Resumo curto e factual em português para a equipe da simulação.",
            },
          },
          required: ["summary"],
        },
      };
      const ai = new GoogleGenAI({
        apiKey: token.token,
        httpOptions: { apiVersion: "v1alpha" },
      });
      const live = await ai.live.connect({
        model: token.model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: instructions }] },
          tools: [{ functionDeclarations: [updateTool] }],
        },
        callbacks: {
          onopen: () =>
            setStatus("Conversa de voz conectada; equipe notificada"),
          onmessage: (message) => {
            if (message.toolCall?.functionCalls)
              void runTools(
                message.toolCall.functionCalls,
                emergencyCreated!.id,
              );
            if (message.serverContent?.interrupted) stopOutput();
            if (!dispatcherConnected.current)
              playAudio(message.serverContent?.modelTurn?.parts || []);
          },
          onerror: () => {
            cleanup();
            setError("A conexão com Gemini foi interrompida.");
          },
          onclose: () => {
            cleanup();
            setStatus("Conversa encerrada; você pode iniciar novamente");
          },
        },
      });
      session.current = live;
      const source = audioContext.createMediaStreamSource(media);
      const input = audioContext.createScriptProcessor(512, 1, 1);
      const silent = audioContext.createGain();
      silent.gain.value = 0;
      processor.current = input;
      input.onaudioprocess = (event) => {
        if (!session.current) return;
        const pcm = downsample(
          event.inputBuffer.getChannelData(0),
          audioContext.sampleRate,
          16000,
        );
        const bytes = new Uint8Array(pcm.buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++)
          binary += String.fromCharCode(bytes[i]);
        session.current.sendRealtimeInput({
          audio: { data: btoa(binary), mimeType: "audio/pcm;rate=16000" },
        });
      };
      source.connect(input);
      input.connect(silent);
      silent.connect(audioContext.destination);
      const initialNote = emergencyCreated.notes?.trim();
      live.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [
              {
                text: `Comece agora a conversa por voz, cumprimentando a pessoa e perguntando como pode ajudar.${initialNote ? ` Já foi informado: ${initialNote}. Considere esse dado ao atualizar o resumo.` : ""}`,
              },
            ],
          },
        ],
        turnComplete: true,
      });
    } catch (cause) {
      cleanup();
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível iniciar a conversa. A ocorrência, se já registrada, continua na fila da central.",
      );
      setStatus(
        emergencyCreated || created
          ? "Ocorrência criada; conversa indisponível"
          : "Pronto para iniciar",
      );
    } finally {
      setBusy(false);
    }
  }

  async function runTools(calls: FunctionCall[], emergencyId: string) {
    const responses = await Promise.all(
      calls.map(async (call) => {
        if (call.name !== "update_emergency_summary")
          return { id: call.id, name: call.name, response: { ok: false } };
        const summary =
          typeof call.args?.summary === "string"
            ? call.args.summary.slice(0, 500)
            : "";
        try {
          if (!summary.trim()) throw new Error("Resumo vazio");
          await updateEmergencyVoiceSummary(emergencyId, summary);
          return { id: call.id, name: call.name, response: { ok: true } };
        } catch {
          return { id: call.id, name: call.name, response: { ok: false } };
        }
      }),
    );
    session.current?.sendToolResponse({ functionResponses: responses });
    setStatus("Resumo da conversa enviado à equipe");
  }

  function playAudio(
    parts: { inlineData?: { data?: string; mimeType?: string } }[],
  ) {
    const audioContext = context.current;
    if (!audioContext) return;
    for (const part of parts) {
      const encoded = part.inlineData?.data;
      if (!encoded || !part.inlineData?.mimeType?.startsWith("audio/pcm"))
        continue;
      const bytes = Uint8Array.from(atob(encoded), (char) =>
        char.charCodeAt(0),
      );
      const samples = new Int16Array(bytes.buffer);
      const buffer = audioContext.createBuffer(1, samples.length, 24000);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => outputSources.current.delete(source);
      source.start(Math.max(audioContext.currentTime, nextOutputTime.current));
      nextOutputTime.current =
        Math.max(audioContext.currentTime, nextOutputTime.current) +
        buffer.duration;
      outputSources.current.add(source);
    }
  }

  function end() {
    cleanup();
    setStatus("Conversa encerrada");
    setMuted(false);
  }

  return (
    <section className="card voice-intake" aria-labelledby="voice-intake-title">
      <span className="eyebrow">GEMINI LIVE · ÁUDIO</span>
      <h2 id="voice-intake-title">Atendimento por voz</h2>
      <p>
        {request
          ? status
          : "Converse por voz. A solicitação vai à central no início; quando houver recursos, a equipe alocada recebe os resumos da conversa."}
      </p>
      {!request || !session.current ? (
        <button
          className="primary"
          type="button"
          disabled={busy || !confirmed}
          onClick={() => void start()}
        >
          {busy
            ? "Preparando voz e notificando a equipe…"
            : "Iniciar conversa por voz com IA"}
        </button>
      ) : (
        <div className="button-row">
          {session.current && (
            <button
              className="secondary"
              type="button"
              onClick={() => {
                const next = !muted;
                setMuted(next);
                stream.current
                  ?.getAudioTracks()
                  .forEach((track) => (track.enabled = !next));
              }}
            >
              {muted ? "Ativar microfone" : "Silenciar microfone"}
            </button>
          )}
          {session.current && (
            <button className="secondary" type="button" onClick={end}>
              Encerrar conversa
            </button>
          )}
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <small>
        Áudio enviado ao Gemini; use somente dados fictícios. Para uma
        emergência real, ligue 192.
      </small>
    </section>
  );
}

function downsample(
  input: Float32Array,
  sourceRate: number,
  targetRate: number,
) {
  if (sourceRate === targetRate) return floatTo16(input);
  const ratio = sourceRate / targetRate;
  const output = new Int16Array(Math.floor(input.length / ratio));
  for (let i = 0; i < output.length; i++) {
    const start = Math.floor(i * ratio),
      end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    const value = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)));
    output[i] = value < 0 ? value * 0x8000 : value * 0x7fff;
  }
  return output;
}

function floatTo16(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const value = Math.max(-1, Math.min(1, input[i]));
    output[i] = value < 0 ? value * 0x8000 : value * 0x7fff;
  }
  return output;
}
