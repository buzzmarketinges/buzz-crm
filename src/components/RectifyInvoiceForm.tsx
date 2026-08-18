'use client'

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createRectificativa } from "@/actions/invoice-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RotateCcw, Building2 } from "lucide-react"
import { toast } from "sonner"

interface RectifyRow {
    name: string
    rawPrice: number    // Importe sin descuento (negado)
    discount: number    // Descuento %
    finalPrice: number  // Importe final = rawPrice * (100 - discount) / 100
    reason: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

function computeFinal(rawPrice: number, discount: number) {
    return round2(discount > 0 ? rawPrice * ((100 - discount) / 100) : rawPrice)
}

export function RectifyInvoiceForm({ invoice, settings }: { invoice: any, settings: any }) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)

    const originalItems = (typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || []) as { name: string, price: number, discount?: number }[]

    const [rows, setRows] = useState<RectifyRow[]>(
        originalItems.map(item => {
            const rawPrice = -Number(item.price)
            const discount = Number(item.discount || 0)
            return {
                name: item.name,
                rawPrice,
                discount,
                finalPrice: computeFinal(rawPrice, discount),
                reason: ""
            }
        })
    )

    // Editing rawPrice or discount recalculates finalPrice (holding the other constant).
    // Editing finalPrice recalculates discount (holding rawPrice constant).
    const updateRawPrice = (idx: number, value: number) => {
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, rawPrice: value, finalPrice: computeFinal(value, r.discount) } : r))
    }
    const updateDiscount = (idx: number, value: number) => {
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, discount: value, finalPrice: computeFinal(r.rawPrice, value) } : r))
    }
    const updateFinalPrice = (idx: number, value: number) => {
        setRows(prev => prev.map((r, i) => {
            if (i !== idx) return r
            const discount = r.rawPrice !== 0 ? round2((1 - value / r.rawPrice) * 100) : 0
            return { ...r, finalPrice: value, discount }
        }))
    }
    const updateReason = (idx: number, value: string) => {
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, reason: value } : r))
    }

    const totals = useMemo(() => {
        const subtotal = rows.reduce((acc, r) => acc + r.finalPrice, 0)

        const applyTax = !!settings.taxEnabled && !invoice.company.canaryTaxExempt
        const taxRate = applyTax ? Number(settings.taxRate) : 0
        const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0

        const withholdingRate = settings.withholdingEnabled ? Number(settings.withholdingRate) : 0
        const withholdingAmount = settings.withholdingEnabled ? subtotal * (withholdingRate / 100) : 0

        const total = subtotal + taxAmount - withholdingAmount

        return { subtotal, taxRate, taxAmount, withholdingRate, withholdingAmount, total }
    }, [rows, settings, invoice.company.canaryTaxExempt])

    const handleSubmit = async () => {
        setIsSaving(true)
        try {
            const result = await createRectificativa(
                invoice.id,
                rows.map(r => ({ name: r.name, price: r.finalPrice, discount: 0, reason: r.reason.trim() || undefined }))
            )
            if (result.success && result.id) {
                toast.success("Factura rectificativa generada correctamente")
                router.push(`/invoices/${result.id}`)
            } else {
                toast.error(result.error || "Error al generar la rectificativa")
            }
        } catch (e) {
            console.error(e)
            toast.error("Error inesperado al generar la rectificativa")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 flex items-center gap-3">
                <div className="h-9 w-9 bg-white rounded-lg shadow-sm flex items-center justify-center text-purple-600">
                    <Building2 className="h-4 w-4" />
                </div>
                <div>
                    <p className="font-semibold text-slate-900">{invoice.company.name}</p>
                    <p className="text-xs text-slate-500">Se invertirán todos los conceptos de la factura {invoice.number}</p>
                </div>
            </div>

            {/* Items */}
            <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-4 font-semibold">Concepto</th>
                            <th className="px-4 py-4 font-semibold">Motivo (opcional)</th>
                            <th className="px-4 py-4 font-semibold text-right">Importe sin dto.</th>
                            <th className="px-4 py-4 font-semibold text-right">Dto. %</th>
                            <th className="px-4 py-4 font-semibold text-right">Importe final</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                        {rows.map((row, idx) => (
                            <tr key={idx}>
                                <td className="px-4 py-4 text-slate-700 font-medium align-top">
                                    {row.name}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <Input
                                        value={row.reason}
                                        onChange={(e) => updateReason(idx, e.target.value)}
                                        placeholder="Ej: no se ha llegado a realizar"
                                        className="bg-gray-50/50 border-gray-200 focus:bg-white shadow-none rounded-lg text-sm min-w-[160px]"
                                    />
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={row.rawPrice}
                                        onChange={(e) => updateRawPrice(idx, Number(e.target.value))}
                                        className="bg-gray-50/50 border-gray-200 focus:bg-white shadow-none rounded-lg text-right font-mono w-28"
                                    />
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={row.discount}
                                        onChange={(e) => updateDiscount(idx, Number(e.target.value))}
                                        className="bg-gray-50/50 border-gray-200 focus:bg-white shadow-none rounded-lg text-right font-mono w-20"
                                    />
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={row.finalPrice}
                                        onChange={(e) => updateFinalPrice(idx, Number(e.target.value))}
                                        className="bg-purple-50/50 border-purple-200 focus:bg-white shadow-none rounded-lg text-right font-mono font-semibold w-28"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50/50 border-t border-slate-200">
                        <tr>
                            <td colSpan={2} className="px-6 py-3 text-right text-slate-500">Importe base</td>
                            <td className="px-6 py-3 text-right font-mono text-slate-900">{totals.subtotal.toFixed(2)}€</td>
                        </tr>
                        {totals.withholdingRate > 0 && (
                            <tr>
                                <td colSpan={2} className="px-6 py-2 text-right text-slate-500">IRPF ({totals.withholdingRate}%)</td>
                                <td className="px-6 py-2 text-right font-mono text-slate-600">{(-totals.withholdingAmount).toFixed(2)}€</td>
                            </tr>
                        )}
                        {totals.taxRate > 0 && (
                            <tr>
                                <td colSpan={2} className="px-6 py-2 text-right text-slate-500">IVA ({totals.taxRate}%)</td>
                                <td className="px-6 py-2 text-right font-mono text-slate-600">
                                    {totals.taxAmount >= 0 ? '+' : ''}{totals.taxAmount.toFixed(2)}€
                                </td>
                            </tr>
                        )}
                        <tr className="bg-slate-100/50 border-t border-slate-200">
                            <td colSpan={2} className="px-6 py-4 text-right font-bold text-slate-900 text-base">Total</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono text-lg text-purple-600">
                                {totals.total.toFixed(2)}€
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700 text-white h-12 px-6 shadow-lg shadow-purple-500/20"
                >
                    {isSaving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                    ) : (
                        <><RotateCcw className="mr-2 h-4 w-4" /> Generar Factura Rectificativa</>
                    )}
                </Button>
            </div>
        </div>
    )
}
