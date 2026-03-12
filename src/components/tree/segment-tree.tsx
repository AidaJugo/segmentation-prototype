import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { TreeNode } from './tree-node'
import type { SegmentGroup } from '../../types'

interface SegmentTreeProps {
  groups: SegmentGroup[]
  selectedSegmentId: string | null
  onSelectSegment: (id: string) => void
  onAddGroup: (name: string) => string
  onRemoveGroup: (groupId: string) => void
  onAddSegment: (groupId: string, parentId: string | null, name: string) => string
  onRenameSegment: (id: string, name: string) => void
  onDeleteSegment: (id: string) => void
  onUpdateGroupMnemonic?: (groupId: string, mnemonic: string) => void
}

function GroupMnemonicBadge({
  mnemonic,
  onUpdate,
}: {
  mnemonic: string
  onUpdate?: (mnemonic: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(mnemonic)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.select()
  }, [editing])

  if (editing && onUpdate) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value.toUpperCase().replace(/\s+/g, ''))}
        onBlur={() => {
          const trimmed = value.trim()
          if (trimmed) onUpdate(trimmed)
          else setValue(mnemonic)
          setEditing(false)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            const trimmed = value.trim()
            if (trimmed) onUpdate(trimmed)
            setEditing(false)
          }
          if (e.key === 'Escape') { setValue(mnemonic); setEditing(false) }
        }}
        onClick={e => e.stopPropagation()}
        className="w-24 text-xs font-mono px-1.5 py-0.5 border border-primary-300 rounded outline-none bg-white"
        maxLength={12}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        if (onUpdate) { setValue(mnemonic); setEditing(true) }
      }}
      className="px-1.5 py-0.5 bg-surface-200 rounded text-xs font-mono text-surface-700 shrink-0 hover:bg-surface-300 transition-colors"
      title="Click to edit mnemonic"
    >
      {mnemonic}
    </button>
  )
}

function GroupSection({
  group,
  selectedSegmentId,
  onSelectSegment,
  onRemoveGroup,
  onAddSegment,
  onRenameSegment,
  onDeleteSegment,
  onUpdateGroupMnemonic,
}: {
  group: SegmentGroup
  selectedSegmentId: string | null
  onSelectSegment: (id: string) => void
  onRemoveGroup: (groupId: string) => void
  onAddSegment: (groupId: string, parentId: string | null, name: string) => string
  onRenameSegment: (id: string, name: string) => void
  onDeleteSegment: (id: string) => void
  onUpdateGroupMnemonic?: (groupId: string, mnemonic: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [newSegmentId, setNewSegmentId] = useState<string | null>(null)

  useEffect(() => {
    if (newSegmentId) {
      const timer = setTimeout(() => setNewSegmentId(null), 200)
      return () => clearTimeout(timer)
    }
  }, [newSegmentId])

  function handleAddRootSegment() {
    const id = onAddSegment(group.id, null, '')
    setNewSegmentId(id)
  }

  function handleAddChild(parentId: string) {
    const id = onAddSegment(group.id, parentId, '')
    setNewSegmentId(id)
  }

  const segmentCount = Object.keys(group.segments).length
  const allSegmentNames = useMemo(() => {
    const names = new Set<string>()
    for (const seg of Object.values(group.segments)) {
      if (seg.name) names.add(seg.name.toLowerCase())
    }
    return names
  }, [group.segments])

  function handleDeleteGroup() {
    if (segmentCount > 0) {
      if (!window.confirm(`Delete "${group.name}" and its ${segmentCount} segment(s)?`)) return
    }
    onRemoveGroup(group.id)
  }

  const dimCount = group.selectedDimensionIds.length

  return (
    <div className="border-b border-surface-200">
      <div className="group/grp flex items-center gap-1 p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          {isExpanded
            ? <ChevronDown size={14} className="text-surface-400 shrink-0" />
            : <ChevronRight size={14} className="text-surface-400 shrink-0" />
          }
          <span className="text-sm font-semibold text-surface-800 truncate">
            {group.name}
          </span>
        </button>
        <GroupMnemonicBadge
          mnemonic={group.mnemonic}
          onUpdate={onUpdateGroupMnemonic ? m => onUpdateGroupMnemonic(group.id, m) : undefined}
        />
        {dimCount > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 shrink-0">
            {dimCount} dims
          </span>
        )}
        <button
          onClick={handleDeleteGroup}
          className="p-1 rounded opacity-0 group-hover/grp:opacity-100 text-surface-400 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Delete group"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="flex items-center justify-between px-4 py-1.5 border-t border-surface-100">
            <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Segments</h3>
            <button
              onClick={handleAddRootSegment}
              className="flex items-center gap-1 px-2 py-1 text-xs text-surface-500 border border-surface-200 rounded-md hover:bg-surface-50 transition-colors"
            >
              <Plus size={12} />
              Add Segment
            </button>
          </div>

          <div className="px-2 pb-2">
            {group.rootSegmentIds.length === 0 && !newSegmentId && (
              <p className="text-xs text-surface-400 px-2 py-3 text-center">
                No segments yet. Add one to start defining rules.
              </p>
            )}
            {group.rootSegmentIds.map(segId => {
              const segment = group.segments[segId]
              if (!segment) return null
              return (
                <TreeNode
                  key={segId}
                  segment={segment}
                  segments={group.segments}
                  selectedId={selectedSegmentId}
                  depth={0}
                  startEditingId={newSegmentId}
                  allSegmentNames={allSegmentNames}
                  onSelect={onSelectSegment}
                  onAddChild={handleAddChild}
                  onRename={onRenameSegment}
                  onDelete={onDeleteSegment}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function SegmentTree({
  groups,
  selectedSegmentId,
  onSelectSegment,
  onAddGroup,
  onRemoveGroup,
  onAddSegment,
  onRenameSegment,
  onDeleteSegment,
  onUpdateGroupMnemonic,
}: SegmentTreeProps) {
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  function handleCreateGroup() {
    const trimmed = newGroupName.trim()
    if (trimmed) {
      onAddGroup(trimmed)
      setNewGroupName('')
      setAddingGroup(false)
    }
  }

  const isEmpty = groups.length === 0

  return (
    <div className="flex flex-col h-full border-r border-surface-200 w-[360px] min-w-[360px]">
      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <GroupSection
            key={group.id}
            group={group}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={onSelectSegment}
            onRemoveGroup={onRemoveGroup}
            onAddSegment={onAddSegment}
            onRenameSegment={onRenameSegment}
            onDeleteSegment={onDeleteSegment}
            onUpdateGroupMnemonic={onUpdateGroupMnemonic}
          />
        ))}

        <div className="p-3">
          {addingGroup ? (
            <input
              autoFocus
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onBlur={() => { if (!newGroupName.trim()) setAddingGroup(false); else handleCreateGroup() }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateGroup()
                if (e.key === 'Escape') { setNewGroupName(''); setAddingGroup(false) }
              }}
              placeholder="Group name..."
              className="w-full text-sm px-2 py-1.5 border border-primary-300 rounded outline-none"
            />
          ) : (
            <div>
              <button
                onClick={() => setAddingGroup(true)}
                className={`flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isEmpty
                    ? 'text-white bg-primary-600 hover:bg-primary-700'
                    : 'text-surface-500 border border-dashed border-surface-300 hover:border-surface-400 hover:text-surface-700 hover:bg-surface-50'
                }`}
              >
                <Plus size={16} />
                New Segment Group
              </button>
              {isEmpty && (
                <p className="text-xs text-surface-400 text-center mt-2">Start by creating a segment group</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
