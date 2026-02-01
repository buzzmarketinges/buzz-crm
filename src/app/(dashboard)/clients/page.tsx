import { getCompanies } from "@/actions/company-actions"
import { getSettings } from "@/actions/settings-actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ClientsTable } from "@/components/ClientsTable"

export default async function ClientsPage() {
    const rawCompanies = await getCompanies()



    const settings = await getSettings()
    const simulatedDate = settings?.simulatedDate ? new Date(settings.simulatedDate).toISOString() : undefined

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-7xl">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Clientes</h1>
                <Link href="/clients/new">
                    <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Cliente</Button>
                </Link>
            </div>

            <ClientsTable initialData={rawCompanies} simulatedDate={simulatedDate} />
        </div>
    )
}
