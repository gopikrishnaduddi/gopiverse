// Ambient drone used for "Sound on" when no trailer file exists
let ctx = null, nodes = null
export const drone = {
  get on() { return !!nodes },
  start() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume()
      const g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5)
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600
      const o = [55, 82.4, 110.3, 164.8].map((fr, i) => { const os = ctx.createOscillator(); os.type = i % 2 ? 'sawtooth' : 'triangle'; os.frequency.value = fr; os.detune.value = (i - 1.5) * 6; os.connect(f); os.start(); return os })
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15; const lg = ctx.createGain(); lg.gain.value = 300; lfo.connect(lg); lg.connect(f.frequency); lfo.start()
      f.connect(g); g.connect(ctx.destination); nodes = { g, o, lfo }
    } catch (e) { /* audio unavailable */ }
  },
  stop() {
    if (!nodes) return
    const { g, o, lfo } = nodes; nodes = null
    try { g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); setTimeout(() => { o.forEach((x) => x.stop()); lfo.stop() }, 400) } catch (e) {}
  },
}
