import type { TimingEntry } from '../types'

const STORAGE_KEY = 'segmentation-timing-data'

export function saveTiming(entries: TimingEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage may not be available in tests
  }
}

export function loadTiming(): TimingEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function exportTimingAsFile(entries: TimingEntry[]): void {
  const data = JSON.stringify(entries, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `segmentation-timing-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
