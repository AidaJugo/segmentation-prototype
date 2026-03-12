import { useState, useCallback, useMemo } from 'react'
import type { Segment, SegmentGroup, SegmentRule, TimingEntry, BucketDefinition } from './types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function useSegmentStore() {
  const [groups, setGroups] = useState<SegmentGroup[]>([])
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<SegmentGroup[][]>([])

  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), structuredClone(groups)])
  }, [groups])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setGroups(last)
      return prev.slice(0, -1)
    })
  }, [])

  const addGroup = useCallback((name: string) => {
    pushUndo()
    const id = `group-${generateId()}`
    const group: SegmentGroup = {
      id,
      name,
      mnemonic: name.toUpperCase().replace(/\s+/g, '').substring(0, 12),
      description: '',
      segments: {},
      rootSegmentIds: [],
      selectedDimensionIds: [],
      bucketDefinitions: {},
    }
    setGroups(prev => [...prev, group])
    return id
  }, [pushUndo])

  const removeGroup = useCallback((groupId: string) => {
    pushUndo()
    setGroups(prev => prev.filter(g => g.id !== groupId))
    setSelectedSegmentId(prev => {
      if (!prev) return null
      const group = groups.find(g => g.id === groupId)
      if (group && group.segments[prev]) return null
      return prev
    })
  }, [pushUndo, groups])

  const updateGroupMnemonic = useCallback((groupId: string, mnemonic: string) => {
    pushUndo()
    setGroups(prev => {
      const next = structuredClone(prev)
      const group = next.find(g => g.id === groupId)
      if (group) {
        group.mnemonic = mnemonic.toUpperCase().replace(/\s+/g, '').substring(0, 12)
      }
      return next
    })
  }, [pushUndo])

  const addSegment = useCallback((groupId: string, parentId: string | null, name: string) => {
    pushUndo()
    const id = `seg-${generateId()}`
    const mnemonic = name.toUpperCase().replace(/\s+/g, '').substring(0, 12)
    const segment: Segment = {
      id,
      name,
      mnemonic,
      parentId,
      children: [],
      rule: null,
      savedRule: null,
      isLeaf: true,
    }

    setGroups(prev => {
      const next = structuredClone(prev)
      const group = next.find(g => g.id === groupId)
      if (!group) return next

      group.segments[id] = segment

      if (parentId && group.segments[parentId]) {
        group.segments[parentId].children.push(id)
        group.segments[parentId].isLeaf = false
      } else {
        group.rootSegmentIds.push(id)
      }

      return next
    })

    return id
  }, [pushUndo])

  const removeSegment = useCallback((segmentId: string) => {
    pushUndo()
    setGroups(prev => {
      const next = structuredClone(prev)
      for (const group of next) {
        const segment = group.segments[segmentId]
        if (!segment) continue

        const removeRecursive = (id: string) => {
          const seg = group.segments[id]
          if (!seg) return
          seg.children.forEach(removeRecursive)
          delete group.segments[id]
        }

        if (segment.parentId && group.segments[segment.parentId]) {
          const parent = group.segments[segment.parentId]
          parent.children = parent.children.filter(c => c !== segmentId)
          if (parent.children.length === 0) parent.isLeaf = true
        } else {
          group.rootSegmentIds = group.rootSegmentIds.filter(id => id !== segmentId)
        }

        removeRecursive(segmentId)
        break
      }
      return next
    })

    if (selectedSegmentId === segmentId) {
      setSelectedSegmentId(null)
    }
  }, [pushUndo, selectedSegmentId])

  const renameSegment = useCallback((segmentId: string, name: string) => {
    pushUndo()
    setGroups(prev => {
      const next = structuredClone(prev)
      for (const group of next) {
        if (group.segments[segmentId]) {
          group.segments[segmentId].name = name
          group.segments[segmentId].mnemonic = name.toUpperCase().replace(/\s+/g, '').substring(0, 12)
          break
        }
      }
      return next
    })
  }, [pushUndo])

  const updateSegmentMnemonic = useCallback((segmentId: string, mnemonic: string) => {
    pushUndo()
    setGroups(prev => {
      const next = structuredClone(prev)
      for (const group of next) {
        if (group.segments[segmentId]) {
          group.segments[segmentId].mnemonic = mnemonic.toUpperCase().replace(/\s+/g, '').substring(0, 12)
          break
        }
      }
      return next
    })
  }, [pushUndo])

  const updateSegmentRule = useCallback((segmentId: string, rule: SegmentRule | null) => {
    pushUndo()
    setGroups(prev => {
      const next = structuredClone(prev)
      for (const group of next) {
        if (group.segments[segmentId]) {
          group.segments[segmentId].rule = rule
          break
        }
      }
      return next
    })
  }, [pushUndo])

  const saveSegmentRule = useCallback((segmentId: string) => {
    setGroups(prev => {
      const next = structuredClone(prev)
      for (const group of next) {
        if (group.segments[segmentId]) {
          group.segments[segmentId].savedRule = structuredClone(group.segments[segmentId].rule)
          break
        }
      }
      return next
    })
  }, [])

  const toggleGroupDimension = useCallback((groupId: string, dimId: number) => {
    setGroups(prev => {
      const next = structuredClone(prev)
      const group = next.find(g => g.id === groupId)
      if (group) {
        const idx = group.selectedDimensionIds.indexOf(dimId)
        if (idx >= 0) {
          group.selectedDimensionIds.splice(idx, 1)
          delete group.bucketDefinitions[dimId]
        } else {
          group.selectedDimensionIds.push(dimId)
        }
      }
      return next
    })
  }, [])

  const updateGroupBuckets = useCallback((groupId: string, dimId: number, buckets: BucketDefinition[]) => {
    setGroups(prev => {
      const next = structuredClone(prev)
      const group = next.find(g => g.id === groupId)
      if (group) {
        group.bucketDefinitions[dimId] = buckets
      }
      return next
    })
  }, [])

  const selectedSegment = useMemo(() => {
    if (!selectedSegmentId) return null
    for (const group of groups) {
      if (group.segments[selectedSegmentId]) return group.segments[selectedSegmentId]
    }
    return null
  }, [selectedSegmentId, groups])

  const selectedGroup = useMemo(() => {
    if (!selectedSegmentId) return null
    for (const group of groups) {
      if (group.segments[selectedSegmentId]) return group
    }
    return null
  }, [selectedSegmentId, groups])

  const allSegments = useMemo(() => {
    const result: Record<string, Segment> = {}
    for (const group of groups) {
      Object.assign(result, group.segments)
    }
    return result
  }, [groups])

  return {
    groups,
    allSegments,
    selectedSegmentId,
    selectedSegment,
    selectedGroup,
    setSelectedSegmentId,
    addGroup,
    removeGroup,
    updateGroupMnemonic,
    toggleGroupDimension,
    updateGroupBuckets,
    addSegment,
    removeSegment,
    renameSegment,
    updateSegmentMnemonic,
    updateSegmentRule,
    saveSegmentRule,
    undo,
    canUndo: undoStack.length > 0,
    resetStore: () => {
      setGroups([])
      setSelectedSegmentId(null)
      setUndoStack([])
    },
  }
}

export function useTimingStore() {
  const [entries, setEntries] = useState<TimingEntry[]>([])

  const startTiming = useCallback((segmentId: string, approach: TimingEntry['approach']) => {
    const entry: TimingEntry = {
      segmentId,
      approach,
      startTime: Date.now(),
      actionCount: 0,
      actions: [],
    }
    setEntries(prev => [...prev, entry])
  }, [])

  const recordAction = useCallback((segmentId: string, actionType: string) => {
    setEntries(prev => {
      const idx = prev.findLastIndex(e => e.segmentId === segmentId && !e.endTime)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        actionCount: next[idx].actionCount + 1,
        actions: [...next[idx].actions, { type: actionType, timestamp: Date.now() }],
      }
      return next
    })
  }, [])

  const endTiming = useCallback((segmentId: string) => {
    setEntries(prev => {
      const idx = prev.findLastIndex(e => e.segmentId === segmentId && !e.endTime)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], endTime: Date.now() }
      return next
    })
  }, [])

  const exportTimingData = useCallback(() => {
    return JSON.stringify(entries, null, 2)
  }, [entries])

  return { entries, startTiming, recordAction, endTiming, exportTimingData }
}
