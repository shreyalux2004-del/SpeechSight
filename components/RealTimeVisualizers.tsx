
import React, { useRef, useEffect, useState } from 'react';

// --- HELPERS ---

// Simple Autocorrelation for Pitch Detection
const getPitch = (analyser: AnalyserNode, sampleRate: number): number => {
  const bufferLength = analyser.fftSize;
  const buffer = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(buffer);

  const SIZE = bufferLength;
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;
  const correlations = new Array(SIZE).fill(0);

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  if (rms < 0.01) return -1; // Too quiet

  let lastCorrelation = 1;
  for (let offset = 0; offset < SIZE; offset++) {
    let correlation = 0;

    for (let i = 0; i < SIZE - offset; i++) {
      correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
    }
    correlation = 1 - (correlation / SIZE);
    correlations[offset] = correlation; 
    
    if ((correlation > 0.9) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      const shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];  
      return sampleRate / (bestOffset + (8 * shift));
    }
    lastCorrelation = correlation;
  }
  
  if (bestCorrelation > 0.01) {
    return sampleRate / bestOffset;
  }
  return -1;
};

// --- COMPONENTS ---

interface VisualizerProps {
  stream: MediaStream;
}

export const LoudnessMeter: React.FC<VisualizerProps> = ({ stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    const analyser = ctx.createAnalyser();
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let active = true;

    const draw = () => {
      if (!active || !canvasRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate RMS roughly
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      
      // 0-255 -> 0-100%
      const pct = Math.min((avg / 60) * 100, 100);

      const canvas = canvasRef.current;
      const c = canvas.getContext('2d');
      if (c) {
         c.clearRect(0, 0, canvas.width, canvas.height);
         
         // Draw segments
         const segments = 10;
         const segmentHeight = (canvas.height - (segments * 2)) / segments;
         
         for (let i = 0; i < segments; i++) {
             const activeSegments = Math.ceil((pct / 100) * segments);
             const isActive = (segments - 1 - i) < activeSegments;
             
             let color = '#e2e8f0'; // slate-200
             if (isActive) {
                 if (i < 2) color = '#f43f5e'; // Red (High)
                 else if (i < 5) color = '#fbbf24'; // Yellow (Med)
                 else color = '#10b981'; // Green (Low)
             }
             
             c.fillStyle = color;
             c.beginPath();
             c.roundRect(0, i * (segmentHeight + 2), canvas.width, segmentHeight, 4);
             c.fill();
         }
      }
      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      active = false;
      if (ctx.state !== 'closed') ctx.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={40} height={200} className="block" />;
};

export const PitchRollercoaster: React.FC<VisualizerProps> = ({ stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gameState = useRef({
     offset: 0,
     playerY: 100, // Normalized 0-200
     points: [] as number[] // The target line
  });

  useEffect(() => {
    if (!stream) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    const analyser = ctx.createAnalyser();
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 2048; // Higher FFT for pitch

    let active = true;

    // Generate Path
    for (let i = 0; i < 500; i++) {
        // Sine wave path
        gameState.current.points.push(100 + Math.sin(i * 0.1) * 50);
    }

    const draw = () => {
      if (!active || !canvasRef.current) return;
      
      const pitch = getPitch(analyser, ctx.sampleRate);
      
      const canvas = canvasRef.current;
      const c = canvas.getContext('2d');
      if (!c) return;
      
      const W = canvas.width;
      const H = canvas.height;
      
      // Update Game State
      gameState.current.offset += 2; // Scroll speed
      
      // Update Player Y based on pitch (Map 100Hz-300Hz to Screen Y)
      // 100Hz = Bottom (H), 300Hz = Top (0)
      if (pitch > 50 && pitch < 500) {
          const targetY = H - ((pitch - 80) / (300 - 80)) * H;
          // Smooth it
          gameState.current.playerY += (targetY - gameState.current.playerY) * 0.1;
      } else {
          // Gravity/Return to center if no voice
          gameState.current.playerY += ((H/2) - gameState.current.playerY) * 0.05;
      }
      
      // Draw Background
      c.fillStyle = '#f8fafc';
      c.fillRect(0, 0, W, H);
      
      // Draw Grid
      c.strokeStyle = '#e2e8f0';
      c.lineWidth = 1;
      c.beginPath();
      for(let i=0; i<W; i+=50) { c.moveTo(i, 0); c.lineTo(i, H); }
      for(let i=0; i<H; i+=50) { c.moveTo(0, i); c.lineTo(W, i); }
      c.stroke();
      
      // Draw Target Path
      c.strokeStyle = '#cbd5e1';
      c.lineWidth = 4;
      c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i < W; i+=2) {
          const pointIdx = Math.floor((gameState.current.offset + i) / 20); // Scale factor
          const y = gameState.current.points[pointIdx % gameState.current.points.length];
          if (i===0) c.moveTo(i, y);
          else c.lineTo(i, y);
      }
      c.stroke();
      
      // Draw Player
      const playerX = 50;
      c.fillStyle = '#6366f1'; // Indigo
      c.beginPath();
      c.arc(playerX, Math.max(10, Math.min(H-10, gameState.current.playerY)), 12, 0, Math.PI*2);
      c.fill();
      
      // Draw Trail
      c.strokeStyle = '#818cf8';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(playerX - 20, Math.max(10, Math.min(H-10, gameState.current.playerY)));
      c.lineTo(playerX, Math.max(10, Math.min(H-10, gameState.current.playerY)));
      c.stroke();

      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      active = false;
      if (ctx.state !== 'closed') ctx.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={300} height={200} className="block w-full h-full rounded-xl" />;
};

export const ResonanceGauge: React.FC<VisualizerProps> = ({ stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    const analyser = ctx.createAnalyser();
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 512;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let active = true;

    const draw = () => {
      if (!active || !canvasRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      
      // Spectral Tilt Proxy for Resonance
      // Low Freq (Nasal Murmur ~250-500Hz) vs High Freq (Oral Airflow ~2k+)
      // Bin size = 44100 / 512 = ~86Hz
      
      let lowSum = 0; // ~200-800Hz (Bins 2 to 9)
      for(let i=2; i<9; i++) lowSum += dataArray[i];
      
      let highSum = 0; // ~2000Hz+ (Bins 23+)
      for(let i=23; i<60; i++) highSum += dataArray[i];
      
      // Avoid div by zero
      const ratio = highSum === 0 ? 0 : lowSum / highSum;
      
      // Normalize Ratio: 
      // High Ratio (>3) = More Low Freq (Nasal/Muffled)
      // Low Ratio (<1) = More High Freq (Oral/Bright)
      
      // Map to -90deg (Oral) to 90deg (Nasal)
      let angle = 0;
      if (ratio > 3) angle = Math.PI / 4; // Nasal
      else if (ratio < 1) angle = -Math.PI / 4; // Oral
      else angle = 0; // Balanced
      
      // Dampening
      // angle = prevAngle + (target - prev) * 0.1

      const canvas = canvasRef.current;
      const c = canvas.getContext('2d');
      if (c) {
         const W = canvas.width;
         const H = canvas.height;
         const CX = W / 2;
         const CY = H - 10;
         const R = W / 2 - 10;
         
         c.clearRect(0, 0, W, H);
         
         // Arc
         c.lineWidth = 10;
         c.strokeStyle = '#e2e8f0';
         c.beginPath();
         c.arc(CX, CY, R, Math.PI, 0); // Half circle
         c.stroke();
         
         // Colored Zones
         // Oral (Left)
         c.strokeStyle = '#3b82f6'; // Blue
         c.beginPath();
         c.arc(CX, CY, R, Math.PI, Math.PI + 1);
         c.stroke();
         
         // Nasal (Right)
         c.strokeStyle = '#f97316'; // Orange
         c.beginPath();
         c.arc(CX, CY, R, -1, 0);
         c.stroke();

         // Labels
         c.fillStyle = '#64748b';
         c.font = '10px sans-serif';
         c.textAlign = 'left'; c.fillText("Oral", 10, H-10);
         c.textAlign = 'right'; c.fillText("Nasal", W-10, H-10);
         
         // Needle
         c.save();
         c.translate(CX, CY);
         c.rotate(angle);
         c.fillStyle = '#1e293b';
         c.beginPath();
         c.moveTo(-5, 0);
         c.lineTo(0, -R + 5);
         c.lineTo(5, 0);
         c.fill();
         c.restore();
      }
      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      active = false;
      if (ctx.state !== 'closed') ctx.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={150} height={80} className="block" />;
};

export const ClarityRing: React.FC<VisualizerProps> = ({ stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    const analyser = ctx.createAnalyser();
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let active = true;

    const draw = () => {
      if (!active || !canvasRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate High Frequency Energy (Consonants/Clarity)
      let highEnergy = 0;
      const startBin = Math.floor(2000 / (ctx.sampleRate / 256)); // ~2kHz
      for (let i = startBin; i < dataArray.length; i++) highEnergy += dataArray[i];
      
      // Normalize
      const clarity = Math.min((highEnergy / (1000)) * 100, 100);

      const canvas = canvasRef.current;
      const c = canvas.getContext('2d');
      if (c) {
         const W = canvas.width;
         const H = canvas.height;
         const CX = W/2;
         const CY = H/2;
         const R = W/2 - 5;
         
         c.clearRect(0, 0, W, H);
         
         // Background Ring
         c.strokeStyle = '#f1f5f9';
         c.lineWidth = 6;
         c.beginPath();
         c.arc(CX, CY, R, 0, Math.PI*2);
         c.stroke();
         
         // Clarity Ring
         c.strokeStyle = '#14b8a6'; // Teal
         c.lineCap = 'round';
         c.beginPath();
         // Start from top (-PI/2)
         const endAngle = (Math.PI * 2 * (clarity / 100)) - Math.PI/2;
         c.arc(CX, CY, R, -Math.PI/2, endAngle);
         c.stroke();
         
         // Text
         c.fillStyle = '#0f766e';
         c.font = 'bold 12px sans-serif';
         c.textAlign = 'center';
         c.textBaseline = 'middle';
         c.fillText(`${Math.round(clarity)}%`, CX, CY);
         
         c.fillStyle = '#94a3b8';
         c.font = '8px sans-serif';
         c.fillText("CLARITY", CX, CY + 10);
      }
      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      active = false;
      if (ctx.state !== 'closed') ctx.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={80} height={80} className="block" />;
};
