import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, Folder, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Segment } from '../../types'
import { ruleHasConditions } from '../../types'

interface TreeNodeProps {
  segment: Segment
  segments: Record<string, Segment>
  selectedId: string | null
  depth: number
  startEditingId?: string | null
  allSegmentNames?: Set<string>
  onSelect: (id: string) => void
  onAddChild: (parentId: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function TreeNode({
  segment,
  segments,
  selectedId,
  depth,
  startEditingId,
  allSegmentNames,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
}: TreeNodeProps) {
  const isNewSegment = startEditingId === segment.id
  const [expanded, setExpanded] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(isNewSegment)
  const [editName, setEditName] = useState(isNewSegment ? '' : segment.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [duplicateWarning, setDuplicateWarning] = useState(false)

  const isSelected = selectedId === segment.id
  const hasChildren = segment.children.length > 0
  const hasRule = ruleHasConditions(segment.rule)
  const isSaved = ruleHasConditions(segment.savedRule)
  const hasUnsavedChanges = hasRule && (!isSaved || JSON.stringify(segment.rule) !== JSON.stringify(segment.savedRule))
  const hasRuleAssigned = hasRule || isSaved

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  function handleFinishEdit() {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== segment.name) {
      const isDuplicate = allSegmentNames && allSegmentNames.has(trimmed.toLowerCase())
      if (isDuplicate) {
        setDuplicateWarning(true)
        setTimeout(() => setDuplicateWarning(false), 2000)
        return
      }
      onRename(segment.id, trimmed)
    } else if (!trimmed && segment.name === '') {
      onDelete(segment.id)
    } else {
      setEditName(segment.name)
    }
    setEditing(false)
  }

  function handleStartRename() {
    setEditName(segment.name)
    setEditing(true)
  }

  function handleClick() {
    if (segment.isLeaf) {
      onSelect(segment.id)
    } else {
      onSelect(segment.id)
      setExpanded(!expanded)
    }
  }

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-1 px-1 rounded cursor-pointer transition-colors ${
          isSelected
            ? 'bg-primary-50 border border-primary-200'
            : 'hover:bg-surface-100 border border-transparent'
        }`}
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
        onClick={handleClick}
      >
        <button
          className="w-5 h-5 flex items-center justify-center shrink-0"
          onClick={e => {
            e.stopPropagation()
            if (hasChildren) setExpanded(!expanded)
          }}
        >
          {hasChildren ? (
            expanded
              ? <ChevronDown size={14} className="text-surface-500" />
              : <ChevronRight size={14} className="text-surface-500" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${
              hasUnsavedChanges ? 'bg-amber-500' : isSaved ? 'bg-green-500' : hasRule ? 'bg-amber-500' : 'bg-surface-300'
            }`} title={hasUnsavedChanges ? 'Unsaved changes' : isSaved ? 'Rule saved' : ''} />
          )}
        </button>

        {hasChildren && (
          <span className="shrink-0 mr-0.5">
            {expanded
              ? <FolderOpen size={14} className="text-surface-400" />
              : <Folder size={14} className="text-surface-400" />
            }
          </span>
        )}

        {editing ? (
          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              value={editName}
              onChange={e => { setEditName(e.target.value); setDuplicateWarning(false) }}
              onBlur={handleFinishEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleFinishEdit()
                if (e.key === 'Escape') {
                  if (segment.name === '') {
                    onDelete(segment.id)
                  } else {
                    setEditName(segment.name)
                  }
                  setEditing(false)
                  setDuplicateWarning(false)
                }
              }}
              placeholder="Segment name..."
              className={`w-full text-sm px-1 py-0.5 border rounded outline-none bg-white ${duplicateWarning ? 'border-red-400' : 'border-primary-300'}`}
              onClick={e => e.stopPropagation()}
            />
            {duplicateWarning && (
              <p className="text-[10px] text-red-500 mt-0.5 px-1">Name already exists</p>
            )}
          </div>
        ) : (
          <button
            onClick={e => {
              e.stopPropagation()
              handleClick()
            }}
            onDoubleClick={e => {
              e.stopPropagation()
              handleStartRename()
            }}
            className={`text-sm truncate flex-1 text-left bg-transparent border-0 p-0 cursor-pointer ${
              isSelected ? 'font-medium text-primary-600' : hasChildren ? 'text-surface-600' : 'text-surface-700'
            }`}
            title="Double-click to rename"
          >
            {segment.name}
          </button>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!hasRuleAssigned && (
            <button
              onClick={e => { e.stopPropagation(); onAddChild(segment.id) }}
              className="p-0.5 rounded hover:bg-surface-200"
              title="Add child segment"
            >
              <Plus size={14} className="text-surface-500" />
            </button>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className="p-0.5 rounded hover:bg-surface-200"
            >
              <MoreHorizontal size={14} className="text-surface-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 z-20 bg-white border border-surface-200 rounded-md shadow-lg py-1 min-w-[140px]">
                <button
                  onClick={e => { e.stopPropagation(); setShowMenu(false); handleStartRename() }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-50"
                >
                  <Pencil size={14} /> Rename
                </button>
                {!hasRuleAssigned && (
                  <button
                    onClick={e => { e.stopPropagation(); setShowMenu(false); onAddChild(segment.id) }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-50"
                  >
                    <Plus size={14} /> Add Child
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setShowMenu(false); onDelete(segment.id) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {segment.children.map(childId => {
            const child = segments[childId]
            if (!child) return null
            return (
              <TreeNode
                key={childId}
                segment={child}
                segments={segments}
                selectedId={selectedId}
                depth={depth + 1}
                startEditingId={startEditingId}
                allSegmentNames={allSegmentNames}
                onSelect={onSelect}
                onAddChild={onAddChild}
                onRename={onRename}
                onDelete={onDelete}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
