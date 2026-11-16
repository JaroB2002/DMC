import { useMemo } from 'react'

type Props = {
  density?: number
  warmth?: number
}

export function Snowfall({ density = 48, warmth = 0 }: Props) {
  const flakes = useMemo(
    () =>
      Array.from({ length: density }, (_, i) => ({
        id: i,
        left: (i * 37) % 100,
        size: 2 + ((i * 13) % 5),
        delay: ((i * 17) % 100) / 10,
        duration: 9 + ((i * 23) % 14),
        drift: ((i * 11) % 40) - 20,
        opacity: 0.25 + ((i * 7) % 50) / 100,
      })),
    [density],
  )

  const goldMix = Math.min(1, Math.max(0, warmth))

  return (
    <div className="snowfall" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="flake"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            ['--drift' as string]: `${f.drift}px`,
            opacity: f.opacity,
            background:
              goldMix > 0.4
                ? `color-mix(in srgb, #F4FBFC ${100 - goldMix * 55}%, #C4A35A ${goldMix * 55}%)`
                : '#F4FBFC',
          }}
        />
      ))}
    </div>
  )
}
