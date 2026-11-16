import { lazy, Suspense, useMemo, useState } from 'react'
import { Snowfall } from './components/Snowfall'
import { useIceBreak } from './hooks/useIceBreak'
import { getSeasonSnapshot } from './lib/season'
import { unlockAudio } from './lib/audio'

const IceCubeScene = lazy(() =>
  import('./components/IceCubeScene').then((m) => ({ default: m.IceCubeScene })),
)

const CYCLE = [
  {
    when: 'Oct 31',
    title: 'The stirring',
    copy: 'Halloween ends. Social feeds whisper the same line: she is defrosting as we speak.',
  },
  {
    when: 'Nov 1',
    title: 'It’s time',
    copy: 'The annual declaration. Speakers warm. The season officially clocks in.',
  },
  {
    when: 'Dec 25',
    title: 'Fully thawed',
    copy: 'Peak Christmas ubiquity. The ice is theoretical. The chorus is not.',
  },
  {
    when: 'Dec 26',
    title: 'Refreeze',
    copy: 'Back to crystal hibernation — until next Halloween cracks the seal.',
  },
] as const

function formatThaw(n: number) {
  return `${Math.round(n)}%`
}

export default function App() {
  const season = useMemo(() => getSeasonSnapshot(new Date()), [])
  const [complete, setComplete] = useState(false)
  const { thaw, cracks, shattered, strike, reset, isComplete } = useIceBreak({
    calendarThaw: Math.min(season.calendarThaw, 42),
    onComplete: () => setComplete(true),
  })

  const statusLabel = shattered || isComplete ? 'Fully thawed' : season.label

  return (
    <div className={`site ${shattered ? 'site-thawed' : ''}`}>
      <a className="skip" href="#lore">
        Skip to lore
      </a>

      <header className="topbar">
        <p className="mark">DEFROST</p>
        <p className="season-chip" data-phase={season.phase}>
          {statusLabel}
        </p>
      </header>

      <section className="hero" aria-label="3D ice cube with Mariah Carey">
        <div className="hero-backdrop" style={{ ['--warmth' as string]: thaw / 100 }} />
        <Snowfall density={shattered ? 70 : 40} warmth={thaw / 100} />

        <Suspense
          fallback={
            <div className="ice-cube-stage cube-fallback">
              <p>Forming the ice cube…</p>
            </div>
          }
        >
          <IceCubeScene
            thaw={thaw}
            cracks={cracks}
            shattered={shattered}
            onStrike={(x, y) => {
              unlockAudio()
              strike(x, y)
            }}
          />
        </Suspense>

        <div className="hero-copy">
          <p className="brand">DEFROST</p>
          <h1>{shattered ? 'Mariah Carey is free.' : 'Mariah Carey is defrosting.'}</h1>
          <p className="lede">
            {shattered
              ? 'The cube shattered. Christmas has entered the chat.'
              : 'A real photo. A wild 3D ice cube. Strike it until the season breaks loose.'}
          </p>
          <div className="cta-row">
            {!shattered ? (
              <button
                type="button"
                className="cta"
                onClick={() => {
                  unlockAudio()
                  strike(48 + Math.random() * 10, 40 + Math.random() * 16)
                }}
              >
                Smash the ice
              </button>
            ) : (
              <button
                type="button"
                className="cta cta-ghost"
                onClick={() => {
                  setComplete(false)
                  reset()
                }}
              >
                Freeze her again
              </button>
            )}
            <p className="thaw-meter" aria-live="polite">
              <span className="thaw-label">Thaw</span>
              <span className="thaw-value">{formatThaw(thaw)}</span>
            </p>
          </div>
        </div>
      </section>

      {complete && (
        <div className="its-time" role="status">
          <p>It’s time.</p>
        </div>
      )}

      <section id="lore" className="section lore">
        <div className="section-inner">
          <p className="eyebrow">The annual ritual</p>
          <h2>A meme that became a holiday weather system.</h2>
          <p className="section-copy">
            Every year as Halloween fades, the internet declares that Mariah Carey is defrosting —
            a joke that she hibernates in ice until “All I Want for Christmas Is You” season returns.
            This chamber puts her in a literal cube. You break it.
          </p>
        </div>
      </section>

      <section className="section status">
        <div className="section-inner status-grid">
          <div>
            <p className="eyebrow">Tonight’s reading</p>
            <h2>{season.label}</h2>
            <p className="section-copy">{season.detail}</p>
          </div>
          <dl className="stats">
            <div>
              <dt>Calendar thaw</dt>
              <dd>{formatThaw(season.calendarThaw)}</dd>
            </div>
            <div>
              <dt>Days to Christmas</dt>
              <dd>{season.daysUntilChristmas}</dd>
            </div>
            <div>
              <dt>Days to next defrost</dt>
              <dd>{season.daysUntilDefrost}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section cycle">
        <div className="section-inner">
          <p className="eyebrow">The cycle</p>
          <h2>Four beats. Every year.</h2>
          <ol className="cycle-list">
            {CYCLE.map((beat) => (
              <li key={beat.when}>
                <p className="when">{beat.when}</p>
                <h3>{beat.title}</h3>
                <p>{beat.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section close">
        <div className="section-inner close-inner">
          <h2>Keep striking until Christmas answers.</h2>
          <p className="section-copy">
            Fan-made ritual site for the defrosting meme — no official affiliation, no copyrighted
            song audio. Photo of Mariah Carey by David Shankbone (CC BY-SA 3.0).
          </p>
          <button
            type="button"
            className="cta"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Return to the cube
          </button>
        </div>
      </section>

      <footer className="footer">
        <p>DEFROST</p>
        <p>
          Photo:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Mariah_Carey_4_by_David_Shankbone.jpg"
            target="_blank"
            rel="noreferrer"
          >
            David Shankbone
          </a>
          , CC BY-SA 3.0
        </p>
      </footer>
    </div>
  )
}
