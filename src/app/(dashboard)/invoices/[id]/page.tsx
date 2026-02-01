import { getInvoice } from "@/actions/invoice-actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { InvoiceDetailContent } from "@/components/InvoiceDetailContent"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const invoice = await getInvoice(id)

    if (!invoice) {
        return <div className="p-10 text-center text-muted-foreground">Factura no encontrada.</div>
    }

    return (
        <div className="container mx-auto py-6 space-y-8 max-w-4xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6 border-border">
                <div className="flex items-center gap-4">
                    <Link href="/billing">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Detalle Factura</h1>
                        <p className="text-muted-foreground">{invoice.number}</p>
                    </div>
                </div>
            </div>

            <InvoiceDetailContent invoice={invoice} />
        </div>
    )
}
