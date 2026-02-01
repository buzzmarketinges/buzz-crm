import { getPendingInvoices } from "@/actions/billing-actions"
import { getInvoices } from "@/actions/invoice-actions"
import { getSettings } from "@/actions/settings-actions"
import { BillingContent } from "@/components/billing/BillingContent"

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
    const pendingInvoices = await getPendingInvoices()
    const [activeInvoices, archivedInvoices, settings] = await Promise.all([
        getInvoices(),
        getInvoices({ archived: true }),
        getSettings()
    ])
    const rawInvoices = [...activeInvoices, ...archivedInvoices].map((inv: any) => ({
        ...inv,
        items: (typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items || [])?.map((item: any) => ({
            ...item,
            price: Number(item.price || 0)
        })) || []
    }))

    const plainSettings = settings ? {
        ...settings,
        yearlyGoal: Number(settings.yearlyGoal || 0),
        taxRate: Number(settings.taxRate || 0),
        withholdingRate: Number(settings.withholdingRate || 0)
    } : undefined

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-7xl">
            <h1 className="text-3xl font-bold text-slate-900">Facturación</h1>
            <BillingContent
                pendingInvoices={pendingInvoices}
                invoiceHistory={rawInvoices}
                settings={plainSettings}
            />
        </div>
    )
}

