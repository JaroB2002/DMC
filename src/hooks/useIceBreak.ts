import { useCallback, useMemo, useRef, useState } from 'react'
import { playCrack, playShatter, playChime, unlockAudio } from '../lib/audio'

export type Crack = {
  id: number
  x: number
  y: number
  angle: number
  length: number
  branches: { angle: number; length: number }[]
  born: number
}

type Options = {
  /** Starting thaw from calendar (0–100) */
  calendarThaw: number
  onComplete?: () => void
}

const HIT_GAIN = 8.5
const COMPLETE_AT = 100

function seedCracks(calendarThaw: number): Crack[] {
  if (calendarThaw < 8) return []
  const count = Math.min(14, Math.floor(calendarThaw / 8))
  return Array.from({ length: count }, (_, i) => {
    const angle = (i * 2.4 + 0.4) % (Math.PI * 2)
    const length = 10 + ((i * 17) % 20)
    return {
      id: -(i + 1),
      x: 28 + ((i * 19) % 44),
      y: 22 + ((i * 23) % 48),
      angle,
      length,
      branches: [
        { angle: angle + 0.7, length: length * 0.45 },
        { angle: angle - 0.55, length: length * 0.38 },
      ],
      born: 0,
    }
  })
}

export function useIceBreak({ calendarThaw, onComplete }: Options) {
  const [manualThaw, setManualThaw] = useState(0)
  const [cracks, setCracks] = useState<Crack[]>(() => seedCracks(calendarThaw))
  const [shattered, setShattered] = useState(false)
  const idRef = useRef(0)
  const completedRef = useRef(false)

  const thaw = useMemo(
    () => Math.min(COMPLETE_AT, calendarThaw + manualThaw),
    [calendarThaw, manualThaw],
  )

  const remaining = Math.max(0, COMPLETE_AT - calendarThaw)

  const strike = useCallback(
    (xPct: number, yPct: number) => {
      unlockAudio()
      if (shattered || completedRef.current) return

      const intensity = 0.35 + Math.random() * 0.55
      playCrack(intensity)

      const angle = Math.random() * Math.PI * 2
      const length = 12 + Math.random() * 22 + intensity * 10
      const branches = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
        angle: angle + (Math.random() - 0.5) * 1.4,
        length: length * (0.35 + Math.random() * 0.45),
      }))

      const crack: Crack = {
        id: ++idRef.current,
        x: xPct,
        y: yPct,
        angle,
        length,
        branches,
        born: Date.now(),
      }

      setCracks((prev) => [...prev.slice(-48), crack])

      setManualThaw((prev) => {
        const next = Math.min(remaining, prev + HIT_GAIN * (0.7 + intensity * 0.5))
        const total = Math.min(COMPLETE_AT, calendarThaw + next)
        if (total >= COMPLETE_AT && !completedRef.current) {
          completedRef.current = true
          setTimeout(() => {
            setShattered(true)
            playShatter()
            setTimeout(() => playChime(), 280)
            onComplete?.()
          }, 180)
        }
        return next
      })
    },
    [calendarThaw, onComplete, remaining, shattered],
  )

  const reset = useCallback(() => {
    completedRef.current = false
    setManualThaw(0)
    setCracks(seedCracks(calendarThaw))
    setShattered(false)
  }, [calendarThaw])

  return {
    thaw,
    cracks,
    shattered,
    strike,
    reset,
    isComplete: thaw >= COMPLETE_AT || shattered,
  }
}
