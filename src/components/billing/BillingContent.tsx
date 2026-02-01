'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Trash2, Archive, ArchiveRestore, Download, Upload } from "lucide-react"
import { AnimatedTabs } from "@/components/ui/AnimatedTabs"
import { BillingHistoryTable } from "@/components/BillingHistoryTable"
import { skipPendingInvoice } from "@/actions/billing-actions"
import { exportInvoicesToExcel, importInvoicesFromExcel } from "@/actions/excel-actions"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BillingContentProps {
    pendingInvoices: any[]
    invoiceHistory: any[]
    settings?: any
}

export function BillingContent({ pendingInvoices, invoiceHistory, settings }: BillingContentProps) {
    const [activeTab, setActiveTab] = useState("history")
    const [isGenerating, setIsGenerating] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)

    // ZIP Download State
    const [isZipDialogOpen, setIsZipDialogOpen] = useState(false)
    const [isZipDownloading, setIsZipDownloading] = useState(false)
    const [zipStart, setZipStart] = useState("")
    const [zipEnd, setZipEnd] = useState("")
    const [zipClient, setZipClient] = useState("all")

    // Deduplicate clients from history for the dropdown
    const uniqueClients = useMemo(() => {
        const clients = new Map()
        invoiceHistory.forEach((inv: any) => {
            if (inv.company) {
                clients.set(inv.company.id, inv.company)
            }
        })
        return Array.from(clients.values())
    }, [invoiceHistory])

    const handleZipDownload = async () => {
        if (!zipStart || !zipEnd) {
            toast.error("Por favor selecciona fecha de inicio y fin")
            return
        }
        setIsZipDownloading(true)
        try {
            const res = await fetch('/api/invoice/download-zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: zipStart,
                    endDate: zipEnd,
                    clientId: zipClient
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Error al descargar ZIP")
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = "facturas.zip"
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            setIsZipDialogOpen(false)
            toast.success("Descarga iniciada")
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Error al generar ZIP")
        } finally {
            setIsZipDownloading(false)
        }
    }

    // Filter local history based on archived state
    const activeInvoices = invoiceHistory.filter((i: any) => !i.isArchived)
    const archivedInvoices = invoiceHistory.filter((i: any) => i.isArchived)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const res = await exportInvoicesToExcel()
            if (res.success && res.base64) {
                const link = document.createElement("a");
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.base64}`;
                link.download = `facturas_${new Date().toISOString().split('T')[0]}.xlsx`;
                link.click();
                toast.success("Excel exportado correctamente")
            } else {
                toast.error("Error al exportar excel")
            }
        } catch (e) {
            toast.error("Error desconocido al exportar")
        }
        setIsExporting(false)
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        setIsImporting(true)

        try {
            const formData = new FormData()
            formData.append('file', e.target.files[0])

            const res = await importInvoicesFromExcel(formData)
            if (res.success) {
                toast.success(`Importación completada. ${res.processedCount} facturas procesadas.`)
                if (res.errors && res.errors.length > 0) {
                    console.error("Import errors:", res.errors)
                    toast.warning(`Algunas filas tuvieron errores. Revisa la consola.`)
                }
            } else {
                toast.error("Error al importar excel")
            }
        } catch (err) {
            toast.error("Error crítico al importar")
        }

        setIsImporting(false)
        e.target.value = '' // Reset
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <AnimatedTabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    tabs={[
                        { id: "history", label: "Facturas Activas" },
                        { id: "archived", label: "Archivadas" },
                        { id: "pending", label: `Pendientes (${pendingInvoices.length})` },
                    ]}
                    className="w-full md:w-auto min-w-[400px]"
                />

                {settings?.isAdminMode && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsZipDialogOpen(true)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Descargar ZIP
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            Exportar Excel
                        </Button>
                        <div className="relative">
                            <Button variant="outline" size="sm" disabled={isImporting} onClick={() => document.getElementById('excel-upload')?.click()}>
                                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Importar Excel
                            </Button>
                            <input
                                id="excel-upload"
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={handleImport}
                            />
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isZipDialogOpen} onOpenChange={setIsZipDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Descargar Facturas (ZIP)</DialogTitle>
                        <DialogDescription>Selecciona el periodo y el cliente para descargar las facturas.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha Inicio</Label>
                                <Input type="date" value={zipStart} onChange={(e) => setZipStart(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha Fin</Label>
                                <Input type="date" value={zipEnd} onChange={(e) => setZipEnd(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <Select value={zipClient} onValueChange={setZipClient}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los clientes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los clientes</SelectItem>
                                    {uniqueClients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsZipDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleZipDownload} disabled={isZipDownloading}>
                            {isZipDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                            Descargar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- HISTORIAL TAB --- */}
            {activeTab === "history" && (
                <div className="space-y-4">
                    <BillingHistoryTable initialData={activeInvoices} key="active" isAdminMode={settings?.isAdminMode} />
                </div>
            )}

            {/* --- ARCHIVED TAB --- */}
            {activeTab === "archived" && (
                <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-500 mb-4">
                        Estas facturas están archivadas y ocultas de la vista principal.
                    </div>
                    <BillingHistoryTable initialData={archivedInvoices} key="archived" isArchivedView isAdminMode={settings?.isAdminMode} />
                </div>
            )}

            {/* --- PENDING TAB --- */}
            {activeTab === "pending" && (
                <div className="grid gap-6">
                    {pendingInvoices.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
                            <div className="mx-auto h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">Todo al día</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">No hay servicios pendientes de facturación para la fecha simulada actual.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pendingInvoices.map((invoiceData) => (
                                <Card key={invoiceData.companyId} className="flex flex-col shadow-sm border-slate-200 hover:shadow-md transition-all group relative">
                                    {/* Delete Button (Hover) */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            title="Saltar esta facturación (Eliminar de pendientes)"
                                            onClick={async (e) => {
                                                e.preventDefault()
                                                if (confirm("¿Estás seguro de que quieres eliminar esta factura pendiente? Se saltará el ciclo de facturación actual para estos servicios.")) {
                                                    const result = await skipPendingInvoice(invoiceData.companyId)
                                                    if (result.success) {
                                                        toast.success("Factura eliminada de pendientes")
                                                    } else {
                                                        toast.error("Error al eliminar factura")
                                                    }
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
                                        {/* ... (Header Content) ... */}
                                        <CardTitle className="text-base font-bold text-slate-800">{invoiceData.companyName}</CardTitle>
                                        <CardDescription className="text-xs font-medium">
                                            {invoiceData.items.length} servicios acumulados
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-3 pt-4">
                                        <div className="space-y-2">
                                            {invoiceData.items.slice(0, 3).map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-sm items-center">
                                                    <span className="text-slate-600 truncate max-w-[180px]" title={item.name}>{item.name}</span>
                                                    <span className="font-mono font-medium text-slate-900 text-xs bg-slate-100 px-1.5 py-0.5 rounded">{item.price.toFixed(2)}€</span>
                                                </div>
                                            ))}
                                            {invoiceData.items.length > 3 && (
                                                <div className="text-xs text-center text-slate-400 italic pt-1">
                                                    + {invoiceData.items.length - 3} servicios más...
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center bg-slate-50/30 p-4 border-t border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total</span>
                                            <span className="text-lg font-bold text-blue-600">
                                                {invoiceData.total.toFixed(2)}€
                                            </span>
                                        </div>
                                        <form
                                            action={`/api/invoice/generate`}
                                            method="POST"
                                            onSubmit={() => setIsGenerating(invoiceData.companyId)}
                                        >
                                            <input type="hidden" name="companyId" value={invoiceData.companyId} />
                                            <input type="hidden" name="items" value={JSON.stringify(invoiceData.items)} />
                                            <Button
                                                size="sm"
                                                className="bg-black hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 transition-all active:scale-95"
                                                disabled={isGenerating === invoiceData.companyId}
                                            >
                                                {isGenerating === invoiceData.companyId ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        Generar <FileText className="ml-2 h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
