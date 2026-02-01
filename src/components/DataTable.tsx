'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ArrowUp, ArrowDown, ChevronRight, CheckSquare, Square } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export type ColumnDef<T> = {
    header: string
    accessorKey?: keyof T | string // string for nested like 'company.name'
    cell?: (item: T) => React.ReactNode // Custom render
    className?: string
    sortable?: boolean
}

interface DataTableProps<T> {
    data: T[]
    columns: ColumnDef<T>[]
    searchPlaceholder?: string
    searchKeys?: string[] // Keys to search in (e.g. ['number', 'company.name'])
    onRowClick?: (item: T) => void
    variant?: 'card' | 'clean'

    // Selection Props
    enableMultiSelection?: boolean
    onSelectionChange?: (selectedIds: string[]) => void
    selectionActions?: React.ReactNode // Actions to show when items are selected
    headerActions?: React.ReactNode // Actions to show next to search bar
    containerClassName?: string
}

function useLongPress(callback: () => void, ms = 500) {
    const [startLongPress, setStartLongPress] = useState(false)
    const timerId = useRef<NodeJS.Timeout | undefined>(undefined)

    const start = useCallback(() => {
        timerId.current = setTimeout(() => {
            callback()
        }, ms)
    }, [callback, ms])

    const stop = useCallback(() => {
        if (timerId.current) {
            clearTimeout(timerId.current)
        }
    }, [])

    return {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: stop,
        onTouchStart: start,
        onTouchEnd: stop,
    }
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    searchPlaceholder = "Buscar...",
    searchKeys = [],
    onRowClick,
    variant = 'card',
    enableMultiSelection = false,
    onSelectionChange,
    selectionActions,
    headerActions,
    containerClassName
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState("")
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Derived state for selection mode
    const isSelectionMode = selectedIds.size > 0

    // Sync selection changes to parent
    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(Array.from(selectedIds))
        }
    }, [selectedIds, onSelectionChange])

    // Helper to get value from path "company.name"
    const getValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj)
    }

    const filteredData = useMemo(() => {
        if (!searchTerm) return data

        const lowerTerm = searchTerm.toLowerCase()
        return data.filter(item => {
            return searchKeys.some(key => {
                const val = getValue(item, key)
                return String(val ?? "").toLowerCase().includes(lowerTerm)
            })
        })
    }, [data, searchTerm, searchKeys])

    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData

        return [...filteredData].sort((a, b) => {
            const valA = getValue(a, sortConfig.key)
            const valB = getValue(b, sortConfig.key)

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }, [filteredData, sortConfig])

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
            }
            return { key, direction: 'asc' }
        })
    }

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const handleRowPress = (item: T) => {
        if (!enableMultiSelection) return;

        // Enter selection mode and select this item
        const id = String(item.id)
        const newSelected = new Set(selectedIds)
        newSelected.add(id)
        setSelectedIds(newSelected)
    }

    const handleRowClickInternal = (item: T) => {
        const id = String(item.id)
        if (isSelectionMode && enableMultiSelection) {
            toggleSelection(id)
        } else if (onRowClick) {
            onRowClick(item)
        }
    }

    // Clear selection
    const clearSelection = () => setSelectedIds(new Set())


    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between gap-4 h-10 shrink-0">
                {isSelectionMode ? (
                    <div className="flex items-center gap-4 flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-md">
                            <span className="font-bold text-sm">{selectedIds.size}</span>
                            <span className="text-xs font-medium opacity-80">seleccionados</span>
                        </div>

                        {selectionActions}

                        <button
                            onClick={clearSelection}
                            className="text-xs font-medium text-slate-500 hover:text-slate-900 ml-auto mr-2"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-4 w-full">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full bg-white"
                            />
                        </div>

                        {headerActions && (
                            <div className="flex items-center gap-2">
                                {headerActions}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={cn(
                variant === 'card' ? "bg-white rounded-xl shadow-sm border border-slate-200" : "",
                "overflow-auto relative",
                containerClassName
            )}>
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                            {enableMultiSelection && isSelectionMode && (
                                <TableHead className="w-10 px-2 sticky top-0 z-50 bg-slate-50">
                                    {/* Header checkbox could go here for select all */}
                                </TableHead>
                            )}
                            {columns.map((col, idx) => {
                                const isSortable = col.sortable !== false && !!col.accessorKey
                                return (
                                    <TableHead
                                        key={idx}
                                        className={`h-12 text-xs font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-50 bg-slate-50 shadow-sm ${col.className ?? ""} ${isSortable ? "cursor-pointer hover:bg-slate-100 hover:text-slate-700 select-none" : ""}`}
                                        onClick={() => isSortable && col.accessorKey && handleSort(col.accessorKey as string)}
                                    >
                                        <div className={`flex items-center gap-1 ${col.className?.includes("text-right") ? "justify-end" : "justify-start"}`}>
                                            {col.header}
                                            {isSortable && sortConfig && sortConfig.key === col.accessorKey && (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (isSelectionMode ? 1 : 0)} className="text-center h-32 text-slate-500 text-sm">
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((item) => (
                                <DataTableRow
                                    key={item.id}
                                    item={item}
                                    columns={columns}
                                    isSelected={selectedIds.has(String(item.id))}
                                    isSelectionMode={isSelectionMode}
                                    onRowClick={() => handleRowClickInternal(item)}
                                    onLongPress={() => handleRowPress(item)}
                                    enableMultiSelection={enableMultiSelection}
                                    getValue={getValue}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-slate-400 text-right px-2">
                Mostrando {sortedData.length} resultados
            </div>
        </div >
    )
}

// Separated Row component to handle hooks cleanly
function DataTableRow<T>({
    item,
    columns,
    isSelected,
    isSelectionMode,
    onRowClick,
    onLongPress,
    enableMultiSelection,
    getValue
}: any) {
    const longPressProps = useLongPress(onLongPress, 600) // 600ms long press

    return (
        <TableRow
            className={`border-b border-slate-100 last:border-0 transition-all relative ${isSelected
                ? "bg-blue-50/60 hover:bg-blue-50/80"
                : "hover:bg-slate-50/50"
                } cursor-pointer group select-none`}
            onClick={onRowClick}
            {...longPressProps}
        >
            {isSelectionMode && enableMultiSelection && (
                <TableCell className="w-10 px-2 py-0">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                    </div>
                </TableCell>
            )}

            {columns.map((col: any, idx: number) => (
                <TableCell key={idx} className={cn(col.className, idx === columns.length - 1 && "relative pr-10")}>
                    {col.cell ? col.cell(item) : (col.accessorKey ? getValue(item, col.accessorKey as string) : null)}

                    {/* Only show chevron if NOT in selection mode */}
                    {!isSelectionMode && idx === columns.length - 1 && (
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </TableCell>
            ))}
        </TableRow>
    )
}
