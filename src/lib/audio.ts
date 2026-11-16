/** Tiny procedural SFX — no copyrighted Christmas music. */

let ctx: AudioContext | null = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
  }
  return ctx
}

export function unlockAudio() {
  const c = getCtx()
  if (c?.state === 'suspended') void c.resume()
}

export function playCrack(intensity = 0.5) {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()

  const now = c.currentTime
  const noiseDur = 0.08 + intensity * 0.12

  // Noise burst through a short buffer
  const bufferSize = Math.floor(c.sampleRate * noiseDur)
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    const env = 1 - i / bufferSize
    data[i] = (Math.random() * 2 - 1) * env * env * (0.25 + intensity * 0.45)
  }

  const noise = c.createBufferSource()
  noise.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 1200 + intensity * 2400
  const gain = c.createGain()
  gain.gain.value = 0.35 + intensity * 0.35
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  noise.start(now)

  // Crystalline ping
  const osc = c.createOscillator()
  const og = c.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(1800 + Math.random() * 900, now)
  osc.frequency.exponentialRampToValueAtTime(420 + Math.random() * 200, now + 0.22)
  og.gain.setValueAtTime(0.0001, now)
  og.gain.exponentialRampToValueAtTime(0.08 + intensity * 0.06, now + 0.01)
  og.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
  osc.connect(og)
  og.connect(c.destination)
  osc.start(now)
  osc.stop(now + 0.3)
}

export function playShatter() {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  const now = c.currentTime

  for (let i = 0; i < 5; i++) {
    const t = now + i * 0.04
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = 600 + i * 280 + Math.random() * 200
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    osc.connect(g)
    g.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.5)
  }

  playCrack(1)
}

export function playChime() {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  const now = c.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = now + i * 0.12
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    osc.connect(g)
    g.connect(c.destination)
    osc.start(t)
    osc.stop(t + 1)
  })
}
