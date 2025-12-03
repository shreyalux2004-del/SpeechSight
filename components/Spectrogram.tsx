

import React, { useRef, useEffect } from 'react';

interface SpectrogramProps {
  isRecording: boolean;
  audioStream: MediaStream | null;
}

export const Spectrogram: React.FC<SpectrogramProps> = ({ isRecording, audioStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isRecording && audioStream && canvasRef.current) {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      // Ensure context is running (sometimes suspended by browser policy until interaction)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(audioStream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      
      if (!canvasCtx) return;

      const draw = () => {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        animationRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = '#f8fafc'; // Match background
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;

          // Clinical Blue/Teal Gradient
          const r = 15;
          const g = 118 + (barHeight / 2); // Variation in green/teal
          const b = 110 + (barHeight / 2); 

          canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
          
          // Draw rounded bars for modern look
          canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
      };

      draw();

      return () => {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }
        // Do NOT close context here if re-using, but for clean unmount:
        // In a strict SPA transition, closing is safer to avoid accumulation.
        // For this visualizer, we assume it unmounts when leaving the recording screen.
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
           audioContextRef.current.close();
           audioContextRef.current = null;
        }
      };
    }
  }, [isRecording, audioStream]);

  return (
    <div className="w-full h-32 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-inner relative">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={128} 
        className="w-full h-full block"
      />
      {!isRecording && (
         <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium">
           Ready to Record
         </div>
      )}
    </div>
  );
};
