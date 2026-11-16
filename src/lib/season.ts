export type SeasonPhase =
  | 'frozen'
  | 'stirring'
  | 'defrosting'
  | 'fully-thawed'
  | 'refreezing'

export type SeasonSnapshot = {
  phase: SeasonPhase
  label: string
  detail: string
  /** 0–100 natural thaw from the calendar alone */
  calendarThaw: number
  dayOfYear: number
  daysUntilChristmas: number
  daysUntilDefrost: number
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = startOfDay(d).getTime() - start.getTime()
  return Math.floor(diff / 86_400_000)
}

function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000)
}

/** Seasonal thaw curve for the Mariah Carey Christmas meme calendar. */
export function getSeasonSnapshot(now = new Date()): SeasonSnapshot {
  const year = now.getFullYear()
  const halloween = new Date(year, 9, 31)
  const nov1 = new Date(year, 10, 1)
  const christmas = new Date(year, 11, 25)
  const boxing = new Date(year, 11, 26)
  const doy = dayOfYear(now)

  const daysUntilChristmas = daysBetween(now, christmas)
  let daysUntilDefrost = daysBetween(now, halloween)
  if (daysUntilDefrost < 0) {
    daysUntilDefrost = daysBetween(now, new Date(year + 1, 9, 31))
  }

  // After Christmas → frozen until next Halloween
  if (now >= boxing) {
    return {
      phase: 'refreezing',
      label: 'Refrozen',
      detail: 'Christmas has passed. She returns to the ice until Halloween ends.',
      calendarThaw: 0,
      dayOfYear: doy,
      daysUntilChristmas: daysBetween(now, new Date(year + 1, 11, 25)),
      daysUntilDefrost,
    }
  }

  // Before Halloween
  if (now < halloween) {
    const stretch = daysBetween(new Date(year, 0, 1), halloween) || 1
    const progress = 1 - daysBetween(now, halloween) / stretch
    const stirring = progress > 0.92
    return {
      phase: stirring ? 'stirring' : 'frozen',
      label: stirring ? 'Stirring' : 'Cryogenically festive',
      detail: stirring
        ? 'Halloween is nearly over. Something in the ice just moved.'
        : 'She sleeps in crystalline silence. Do not play Christmas music yet.',
      calendarThaw: stirring ? 4 : 0,
      dayOfYear: doy,
      daysUntilChristmas: daysUntilChristmas < 0 ? daysBetween(now, new Date(year + 1, 11, 25)) : daysUntilChristmas,
      daysUntilDefrost,
    }
  }

  // Halloween night — the ritual begins
  if (now >= halloween && now < nov1) {
    return {
      phase: 'stirring',
      label: 'The defrosting has begun',
      detail: 'Halloween costumes still linger. Hair dryers aimed at the ice. It’s time.',
      calendarThaw: 12,
      dayOfYear: doy,
      daysUntilChristmas,
      daysUntilDefrost: 0,
    }
  }

  // Nov 1 → Christmas Eve: thaw accelerates
  if (now < christmas) {
    const span = daysBetween(nov1, christmas) || 1
    const elapsed = daysBetween(nov1, now)
    const t = Math.min(1, Math.max(0, elapsed / span))
    // Ease into mid-season ubiquity
    const calendarThaw = Math.round(18 + t * 72)
    return {
      phase: 'defrosting',
      label: 'Actively defrosting',
      detail:
        t < 0.35
          ? 'Radio softens. Store speakers warm up. The whistle notes are waking.'
          : t < 0.75
            ? 'She is halfway free. Every mall aisle knows her name.'
            : 'Nearly thawed. December has claimed the air.',
      calendarThaw,
      dayOfYear: doy,
      daysUntilChristmas,
      daysUntilDefrost: 0,
    }
  }

  // Christmas Day
  return {
    phase: 'fully-thawed',
    label: 'Fully thawed',
    detail: 'Peak Christmas. The ice is gone. The season is hers.',
    calendarThaw: 100,
    dayOfYear: doy,
    daysUntilChristmas: 0,
    daysUntilDefrost: daysBetween(now, new Date(year + 1, 9, 31)),
  }
}

export function phaseAccent(phase: SeasonPhase): string {
  switch (phase) {
    case 'frozen':
      return 'frozen'
    case 'stirring':
      return 'stirring'
    case 'defrosting':
      return 'defrosting'
    case 'fully-thawed':
      return 'thawed'
    case 'refreezing':
      return 'refrozen'
  }
}
