'use client';
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  /** Called with the decoded QR text once a code is read. */
  onResult: (text: string) => void;
  onClose: () => void;
}

/**
 * Lightweight QR scanner built on the native BarcodeDetector API + getUserMedia.
 *
 * No external dependency. Supported in Chrome / Edge / Opera / Samsung Internet
 * on Android, and Chrome on desktop. Safari iOS does NOT ship BarcodeDetector
 * yet, so on those devices we fall back to a friendly message asking the user
 * to paste the link manually. Most of our users are Android / Chrome so this
 * is the pragmatic trade-off until adding a JS-based decoder is justified.
 */
export default function QrScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Detect support up front so the unsupported-browser branch can render
    // an explanatory UI instead of a black video square that never resolves.
    const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!BarcodeDetectorCtor) {
      setUnsupported(true);
      return;
    }

    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && codes[0].rawValue) {
              onResult(codes[0].rawValue);
              return; // stop scanning once we find one
            }
          } catch {
            // Detection can throw transiently while the video frame isn't ready.
            // Swallow and try the next frame.
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudo abrir la cámara';
        setError(msg);
      }
    };
    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-sm">
        <div className="aspect-square rounded-2xl overflow-hidden bg-black relative">
          {!unsupported && !error && (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          )}
          {!unsupported && !error && (
            <div className="absolute inset-8 border-2 border-white/60 rounded-xl pointer-events-none" />
          )}
          {unsupported && (
            <div className="w-full h-full flex flex-col items-center justify-center text-white text-center px-6">
              <p className="text-sm">
                Tu navegador no soporta escaneo de QR. Probá desde Chrome en Android o Edge,
                o copiá el link manualmente.
              </p>
            </div>
          )}
          {error && (
            <div className="w-full h-full flex flex-col items-center justify-center text-white text-center px-6">
              <p className="text-sm">⚠️ {error}</p>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-xl bg-white text-zinc-900 font-semibold text-sm"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
