import { getInvoice } from "@/actions/invoice-actions"
import { getSettings } from "@/actions/settings-actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { RectifyInvoiceForm } from "@/components/RectifyInvoiceForm"

export default async function RectifyInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [invoice, settings] = await Promise.all([getInvoice(id), getSettings()])

    if (!invoice) {
        return <div className="p-10 text-center text-muted-foreground">Factura no encontrada.</div>
    }

    if (invoice.isRectificativa) {
        return <div className="p-10 text-center text-muted-foreground">No se puede generar una rectificativa de otra rectificativa.</div>
    }

    if (invoice.rectifiedBy && invoice.rectifiedBy.length > 0) {
        return (
            <div className="p-10 text-center text-muted-foreground space-y-4">
                <p>Esta factura ya tiene una rectificativa generada.</p>
                <Link href={`/invoices/${invoice.rectifiedBy[0].id}`}>
                    <Button variant="outline">Ver Rectificativa</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-8 max-w-4xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6 border-border">
                <div className="flex items-center gap-4">
                    <Link href={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Generar Rectificativa</h1>
                        <p className="text-muted-foreground">Corrigiendo la factura {invoice.number}</p>
                    </div>
                </div>
            </div>

            <RectifyInvoiceForm invoice={invoice} settings={settings} />
        </div>
    )
}
