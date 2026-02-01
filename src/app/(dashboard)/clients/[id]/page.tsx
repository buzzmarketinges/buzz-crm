import { getCompany } from "@/actions/company-actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ClientDetailContent } from "@/components/ClientDetailContent"

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const company = await getCompany(id)

    if (!company) {
        return <div className="p-10 text-center text-muted-foreground">Cliente no encontrado. ID inv&aacute;lido o eliminado.</div>
    }

    return (
        <div className="container mx-auto py-6 space-y-8 max-w-7xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6 border-border">
                <div className="flex items-center gap-4">
                    <Link href="/clients">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{company.name}</h1>
                        <p className="text-muted-foreground">{company.businessName}</p>
                    </div>
                </div>
            </div>

            <ClientDetailContent company={company} />
        </div>
    )
}
