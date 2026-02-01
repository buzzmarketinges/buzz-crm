import { getServices, getServiceTemplates } from "@/actions/service-actions"
import { ServicesTable } from "@/components/ServicesTable"
import { ServiceTemplatesManager } from "@/components/ServiceTemplatesManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
    const services = await getServices()
    const templates = await getServiceTemplates()

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-7xl h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <h1 className="text-3xl font-bold text-slate-900">Gestión de Servicios</h1>
                <div className="text-slate-500 text-sm">
                    Administra tus servicios activos y el catálogo de prestaciones.
                </div>
            </div>

            <Tabs defaultValue="active" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-fit mb-4">
                    <TabsTrigger value="active">Servicios Activos</TabsTrigger>
                    <TabsTrigger value="templates">Catálogo Predefinido</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="flex-1 overflow-auto">
                    <ServicesTable initialData={services} />
                </TabsContent>

                <TabsContent value="templates" className="flex-1 overflow-auto">
                    <ServiceTemplatesManager initialTemplates={templates} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
