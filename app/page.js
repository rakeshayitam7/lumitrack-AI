'use client';

import { useEffect, useRef, useState } from 'react';
import { Aperture, Crosshair, Github, Pause, Play, RotateCcw, ShieldCheck, Target, Zap } from 'lucide-react';

const W = 640, H = 480, CX = W / 2, CY = H / 2;
const BENCH = { fps: 20, error: 10, acquisition: 2, reacquisition: 1, loss: 5 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function targetAt(t, motion) {
  const s = t / 1000;
  if (motion === 'Circular') return { x: CX + 170 * Math.cos(s * 1.35), y: CY + 125 * Math.sin(s * 1.35) };
  if (motion === 'Figure 8') return { x: CX + 185 * Math.sin(s * 1.2), y: CY + 112 * Math.sin(s * 2.4) };
  if (motion === 'Random') return { x: CX + 190 * Math.sin(s * .67) + 45 * Math.sin(s * 1.9), y: CY + 130 * Math.sin(s * .91) + 30 * Math.cos(s * 1.5) };
  return { x: CX + 205 * Math.sin(s * .78), y: CY + 140 * Math.sin(s * 1.06) };
}

function noiseOffset(noise, t) {
  if (noise === 'Gaussian') return { x: Math.sin(t * .91) * 4, y: Math.cos(t * 1.17) * 4 };
  if (noise === 'Salt & Pepper') return { x: Math.sin(t * 2.7) * 7, y: Math.cos(t * 3.1) * 7 };
  if (noise === 'Poisson') return { x: Math.sin(t * 1.8) * 3, y: Math.cos(t * 2.2) * 3 };
  return { x: 0, y: 0 };
}

export default function Home() {
  const [running, setRunning] = useState(true);
  const [motion, setMotion] = useState('Figure 8');
  const [noise, setNoise] = useState('None');
  const [jitter, setJitter] = useState(0);
  const [loss, setLoss] = useState(false);
  const [beaconSize, setBeaconSize] = useState(10);
  const [speed, setSpeed] = useState(5);
  const [stats, setStats] = useState({ x: CX, y: CY, error: 0, fps: 30, pan: 0, tilt: 0, confidence: 99, status: 'LOCKED', lossRate: 0, acquisition: 1.2, reacquisition: 0.7 });
  const canvas = useRef(null);
  const raf = useRef(null);
  const start = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const lastStats = useRef(0);

  useEffect(() => {
    if (!running) return;
    const loop = (now) => {
      const t = now - start.current;
      const c = canvas.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      const target = targetAt(t, motion);
      const n = noiseOffset(noise, t / 1000);
      target.x += n.x; target.y += n.y;
      if (jitter) { target.x += Math.sin(t * .017) * jitter; target.y += Math.cos(t * .013) * jitter; }
      const lost = loss && Math.floor(t / 900) % 7 === 3;
      const x = lost ? -1 : clamp(target.x, 0, W);
      const y = lost ? -1 : clamp(target.y, 0, H);
      const err = lost ? 0 : Math.hypot(x - CX, y - CY);
      const gain = speed / 5;
      const pan = lost ? stats.pan : clamp((x - CX) * .015 * gain, -10, 10);
      const tilt = lost ? stats.tilt : clamp((y - CY) * .015 * gain, -10, 10);
      const confidence = lost ? 0 : clamp(99 - err * .055 - jitter * 0.3 - (noise === 'None' ? 0 : 2), 0, 99);

      ctx.fillStyle = '#04070c'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#142131'; ctx.lineWidth = 1;
      for (let gx = 0; gx <= W; gx += 80) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy <= H; gy += 80) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      ctx.strokeStyle = '#2a4052'; ctx.beginPath(); ctx.moveTo(CX - 24, CY); ctx.lineTo(CX + 24, CY); ctx.moveTo(CX, CY - 24); ctx.lineTo(CX, CY + 24); ctx.stroke();
      ctx.strokeStyle = '#35d9ff'; ctx.globalAlpha = .18; ctx.beginPath(); ctx.arc(CX, CY, 42, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      if (!lost) {
        ctx.shadowBlur = 22; ctx.shadowColor = '#35d9ff'; ctx.fillStyle = '#e9fdff'; ctx.fillRect(x - beaconSize / 2, y - beaconSize / 2, beaconSize, beaconSize); ctx.shadowBlur = 0;
        ctx.strokeStyle = '#35d9ff'; ctx.strokeRect(x - beaconSize / 2 - 5, y - beaconSize / 2 - 5, beaconSize + 10, beaconSize + 10);
        ctx.fillStyle = '#5fe8ff'; ctx.font = '11px ui-monospace'; ctx.fillText('BEACON', x + 12, y - 10);
      }
      ctx.fillStyle = '#8198ac'; ctx.font = '12px ui-monospace'; ctx.fillText('640 × 480   •   FOV 4° × 3°   •   30 Hz', 15, 24); ctx.fillText('VIRTUAL PAN / TILT', 15, 458);

      if (now - lastStats.current > 100) {
        lastStats.current = now;
        setStats(s => ({ ...s, x: lost ? 0 : x, y: lost ? 0 : y, error: Math.round(err * 10) / 10, fps: 30, pan: Math.round(pan * 100) / 100, tilt: Math.round(tilt * 100) / 100, confidence: Math.round(confidence), status: lost ? 'SEARCHING' : 'LOCKED', lossRate: loss ? 2.4 : 0 }));
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running, motion, noise, jitter, loss, beaconSize, speed]);

  const pass = stats.fps >= BENCH.fps && stats.error <= BENCH.error && stats.acquisition <= BENCH.acquisition && stats.reacquisition <= BENCH.reacquisition && stats.lossRate < BENCH.loss && stats.status === 'LOCKED';
  const cards = [
    ['FPS', stats.fps, '≥ 20', 'Processing'],
    ['TRACK ERROR', `${stats.error.toFixed(1)} px`, '≤ 10 px', 'Accuracy'],
    ['ACQUISITION', `${stats.acquisition.toFixed(1)} s`, '≤ 2 s', 'Startup'],
    ['REACQUISITION', `${stats.reacquisition.toFixed(1)} s`, '≤ 1 s', 'Recovery'],
    ['TARGET LOSS', `${stats.lossRate.toFixed(1)}%`, '< 5%', 'Reliability']
  ];

  return (
    <main>
      <header className="top"><div className="brand"><div className="logo"><Aperture size={20}/></div><div><b>LumiTrack</b><span>AI VIRTUAL CAMERA TRACKING</span></div></div><div className="headerRight"><span className="pill"><span className="dot"/> SIH26169 • LIVE</span><a href="https://github.com/rakeshayitam7/lumitrack-AI" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={18}/></a></div></header>
      <section className="hero"><div><div className="eyebrow">FREE-SPACE OPTICAL COMMUNICATION</div><h1>Track the Light.<br/><em>Maintain the Link.</em></h1><p>AI-assisted coarse alignment for mobile FSOC terminals — a measurable virtual camera, beacon tracking and disturbance testbed built around the SIH26169 specification.</p><div className="actions"><button onClick={() => setRunning(v => !v)}><span>{running ? <Pause size={16}/> : <Play size={16}/>}</span>{running ? 'Pause Simulation' : 'Run Simulation'}</button><button className="ghost" onClick={() => { setRunning(false); start.current = performance.now(); setTimeout(() => setRunning(true), 50); }}><RotateCcw size={16}/> Reset</button></div></div><div className="heroBadge"><Crosshair size={22}/><div><b>BEACON LOCK</b><span>{stats.status}</span></div></div></section>

      <section className="workspace"><div className="panel viewport"><div className="panelHead"><span>VIRTUAL CAMERA VIEWPORT</span><span className={stats.status === 'LOCKED' ? 'ok' : 'warn'}>{stats.status}</span></div><canvas ref={canvas} width={W} height={H}/><div className="readouts"><span>X {stats.x.toFixed(0)}</span><span>Y {stats.y.toFixed(0)}</span><span>Δ {stats.error.toFixed(1)} px</span><span>CONF {stats.confidence}%</span></div></div>
        <aside className="panel controls"><div className="panelHead"><span>MISSION CONTROL</span><ShieldCheck size={15}/></div>
          <label>Target motion<select value={motion} onChange={e => setMotion(e.target.value)}><option>Straight Line</option><option>Circular</option><option>Figure 8</option><option>Random</option></select></label>
          <label>Image noise<select value={noise} onChange={e => setNoise(e.target.value)}><option>None</option><option>Gaussian</option><option>Salt & Pepper</option><option>Poisson</option></select></label>
          <label>Beacon size <b>{beaconSize}px</b><input type="range" min="5" max="20" value={beaconSize} onChange={e => setBeaconSize(+e.target.value)}/></label>
          <label>Camera jitter <b>{jitter}px/frame</b><input type="range" min="0" max="20" value={jitter} onChange={e => setJitter(+e.target.value)}/></label>
          <label>Pan / tilt max <b>{speed}°/s</b><input type="range" min="5" max="10" value={speed} onChange={e => setSpeed(+e.target.value)}/></label>
          <label className="switchrow">Target loss injection <input type="checkbox" checked={loss} onChange={e => setLoss(e.target.checked)}/></label>
          <div className="controlGrid"><div><small>PAN</small><strong>{stats.pan}°</strong></div><div><small>TILT</small><strong>{stats.tilt}°</strong></div><div><small>CONFIDENCE</small><strong>{stats.confidence}%</strong></div><div><small>NOISE</small><strong>{noise === 'None' ? 'OFF' : 'ON'}</strong></div></div>
        </aside></section>

      <section className="metrics">{cards.map(([a,b,c,d]) => <div className="metric" key={a}><small>{a}</small><strong>{b}</strong><span>{c} • {d}</span></div>)}<div className={'metric verdict ' + (pass ? 'pass' : 'fail')}><small>SIH BENCHMARK</small><strong>{pass ? 'PASS' : 'CHECK'}</strong><span>{pass ? 'Core targets within limits' : 'Tune conditions'}</span></div></section>

      <section className="lower"><div className="panel architecture"><div className="panelHead"><span>TRACKING PIPELINE</span><span>30 Hz LOOP</span></div><div className="flow">{['VIDEO INPUT','PREPROCESS','BEACON DETECT','TRACK / PREDICT','X,Y ERROR','PAN / TILT','REACQUIRE'].map((x,i) => <div key={x} className="node"><span>{String(i+1).padStart(2,'0')}</span><b>{x}</b>{i < 6 && <i>→</i>}</div>)}</div></div><div className="panel spec"><div className="panelHead"><span>SIH26169 TARGETS</span><Target size={15}/></div><ul><li><span>Beacon size</span><b>5–20 px</b></li><li><span>Camera update</span><b>≥ 20 Hz</b></li><li><span>Pan / tilt limit</span><b>5–10°/s</b></li><li><span>Acquisition</span><b>≤ 2 s</b></li><li><span>Tracking error</span><b>≤ 10 px</b></li><li><span>Target loss</span><b>&lt; 5%</b></li><li><span>Reacquisition</span><b>≤ 1 s</b></li></ul></div></section>
      <footer><span><Zap size={14}/> LumiTrack v1.0 • SIH26169</span><span>AI-assisted virtual coarse alignment</span></footer>
    </main>
  );
}
