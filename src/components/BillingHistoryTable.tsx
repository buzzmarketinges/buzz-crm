'use client'

import { useRouter } from "next/navigation"

import { useState, useMemo } from 'react'
import { DataTable, ColumnDef } from "@/components/DataTable"
import { InvoiceStatusSelect } from "@/components/InvoiceStatusSelect"
import { Button } from "@/components/ui/button"
import { Archive, ArchiveRestore, Eye, Download, Loader2, Check, X, Filter, Trash2 } from "lucide-react"
import { toggleInvoiceArchive, getInvoice, updateInvoiceStatus, deleteInvoice } from "@/actions/invoice-actions"
import Link from "next/link"
import { SidePanel } from "@/components/ui/SidePanel"
import { InvoiceDetailContent } from "@/components/InvoiceDetailContent"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BillingHistoryTableProps {
    initialData: any[]
    isArchivedView?: boolean
    isAdminMode?: boolean
}

export function BillingHistoryTable({ initialData, isArchivedView = false, isAdminMode = false }: BillingHistoryTableProps) {
    const router = useRouter()
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isBulkUpdating, setIsBulkUpdating] = useState(false)

    // Filters
    const [filters, setFilters] = useState({
        date: '',
        client: '',
        status: 'all',
        minAmount: '',
        maxAmount: ''
    })

    const filteredData = useMemo(() => {
        return initialData.filter(item => {
            if (filters.date && !item.issueDate.startsWith(filters.date)) return false
            // Handle nested company name safely
            const clientName = item.company?.name || ""
            if (filters.client && !clientName.toLowerCase().includes(filters.client.toLowerCase())) return false
            if (filters.status !== 'all' && item.status !== filters.status) return false
            const amt = Number(item.totalAmount)
            if (filters.minAmount && amt < Number(filters.minAmount)) return false
            if (filters.maxAmount && amt > Number(filters.maxAmount)) return false
            return true
        })
    }, [initialData, filters])

    const handleRowClick = async (item: any) => {
        setSelectedInvoiceId(item.id)
        setIsLoading(true)
        setSelectedInvoice(null)

        try {
            const data = await getInvoice(item.id)
            setSelectedInvoice(data)
        } catch (error) {
            console.error("Failed to load invoice details", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleBulkStatusChange = async (status: string) => {
        if (selectedIds.length === 0) return

        setIsBulkUpdating(true)
        try {
            // Execute all updates in parallel
            await Promise.all(selectedIds.map(id => updateInvoiceStatus(id, status)))

            toast.success("Facturas actualizadas", {
                description: `${selectedIds.length} facturas marcadas como ${status === 'PAID' ? 'PAGADO' : status === 'SENT' ? 'ENVIADO' : 'CREADO'}`
            })

            // Clear selection and refresh
            setSelectedIds([])
            router.refresh()
        } catch (e) {
            toast.error("Error al actualizar facturas")
            console.error(e)
        } finally {
            setIsBulkUpdating(false)
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            header: "Número",
            accessorKey: "number",
            className: "font-mono font-medium text-slate-700 pl-6 w-[15%]",
            sortable: true
        },
        {
            header: "Cliente",
            accessorKey: "company.name",
            className: "font-semibold text-slate-900 w-[25%]",
            sortable: true
        },
        {
            header: "Fecha",
            accessorKey: "issueDate",
            cell: (inv) => new Date(inv.issueDate).toLocaleDateString(),
            className: "text-slate-500 text-sm w-[15%]",
            sortable: true
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (inv) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <InvoiceStatusSelect
                        invoiceId={inv.id}
                        currentStatus={inv.status}
                        lastError={(inv as any).lastError}
                    />
                </div>
            ),
            sortable: true,
            className: "w-[20%]"
        },
        {
            header: "Total",
            accessorKey: "totalAmount",
            cell: (inv) => `${Number(inv.totalAmount).toFixed(2)}€`,
            className: "text-right font-mono font-bold text-slate-700 pr-6 w-[15%]",
            sortable: true
        },
        {
            header: "Acciones",
            cell: (inv) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <a href={`/api/invoice/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Descargar PDF">
                            <Download className="h-4 w-4" />
                        </Button>
                    </a>

                    {isAdminMode && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Eliminar permanentemente"
                            onClick={async (e) => {
                                e.stopPropagation()
                                if (confirm("¿ESTÁS SEGURO? Esta acción borrará la factura permanentemente.")) {
                                    const res = await deleteInvoice(inv.id)
                                    if (res.success) {
                                        toast.success("Factura eliminada")
                                        router.refresh()
                                    } else {
                                        toast.error("Error al eliminar")
                                    }
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}

                    {isArchivedView ? (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-orange-600"
                            title="Restaurar"
                            onClick={async () => {
                                await toggleInvoiceArchive(inv.id, false)
                                router.refresh()
                                toast.success("Factura restaurada")
                            }}
                        >
                            <ArchiveRestore className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-gray-600"
                            title="Archivar"
                            onClick={async () => {
                                await toggleInvoiceArchive(inv.id, true)
                                router.refresh()
                                toast.success("Factura archivada")
                            }}
                        >
                            <Archive className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
            className: "text-right pr-6 w-[15%]"
        }
    ]

    return (
        <>
            <DataTable
                data={filteredData}
                columns={columns}
                searchKeys={['number', 'company.name']}
                onRowClick={handleRowClick}
                enableMultiSelection={true}
                onSelectionChange={setSelectedIds}
                containerClassName="max-h-[calc(100vh-320px)]"
                headerActions={(
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2 border-dashed">
                                <Filter className="w-4 h-4" /> Filtros
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Filtrar Facturas</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fecha</Label>
                                        <Input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado</Label>
                                        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="DRAFT">Borrador</SelectItem>
                                                <SelectItem value="SENT">Enviado</SelectItem>
                                                <SelectItem value="PAID">Pagado</SelectItem>
                                                <SelectItem value="OVERDUE">Vencido</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cliente</Label>
                                    <Input placeholder="Nombre del cliente..." value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Min. Importe</Label>
                                        <Input type="number" placeholder="0.00" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max. Importe</Label>
                                        <Input type="number" placeholder="Max" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setFilters({ date: '', client: '', status: 'all', minAmount: '', maxAmount: '' })}>Limpiar Filtros</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
                selectionActions={
                    <div className="flex items-center gap-2">
                        {isArchivedView ? (
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={isBulkUpdating}
                                onClick={async () => {
                                    if (confirm(`¿Restaurar ${selectedIds.length} facturas?`)) {
                                        setIsBulkUpdating(true)
                                        await Promise.all(selectedIds.map(id => toggleInvoiceArchive(id, false)))
                                        router.refresh()
                                        setSelectedIds([])
                                        setIsBulkUpdating(false)
                                        toast.success("Facturas restauradas")
                                    }
                                }}
                                className="h-8 bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200"
                            >
                                <ArchiveRestore className="h-3 w-3 mr-2" /> Restaurar
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={isBulkUpdating}
                                onClick={async () => {
                                    if (confirm(`¿Archivar ${selectedIds.length} facturas?`)) {
                                        setIsBulkUpdating(true)
                                        await Promise.all(selectedIds.map(id => toggleInvoiceArchive(id, true)))
                                        router.refresh()
                                        setSelectedIds([])
                                        setIsBulkUpdating(false)
                                        toast.success("Facturas archivadas")
                                    }
                                }}
                                className="h-8 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                            >
                                <Archive className="h-3 w-3 mr-2" /> Archivar
                            </Button>
                        )}
                        {!isArchivedView && (
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={isBulkUpdating}
                                onClick={() => handleBulkStatusChange('PAID')}
                                className="h-8 bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                            >
                                Marcar como Pagado
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={isBulkUpdating}
                            onClick={() => handleBulkStatusChange('SENT')}
                            className="h-8 bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200"
                        >
                            Marcar como Enviado
                        </Button>
                    </div>
                }
            />

            <SidePanel
                isOpen={!!selectedInvoiceId}
                onClose={() => setSelectedInvoiceId(null)}
                title={selectedInvoice ? `Factura ${selectedInvoice.number}` : "Cargando..."}
                width="max-w-2xl"
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>Cargando factura...</p>
                    </div>
                ) : (
                    selectedInvoice && (
                        <InvoiceDetailContent
                            invoice={selectedInvoice}
                            onUpdate={async () => {
                                const refreshed = await getInvoice(selectedInvoice.id)
                                setSelectedInvoice(refreshed)
                                router.refresh()
                            }}
                        />
                    )
                )}
            </SidePanel>
        </>
    )
}
