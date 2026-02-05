
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const idsToDelete = [
    "be1cff50-b786-44aa-bf85-a5e18dd22aaf", // BuzzMarketing LLC
    "71a41fca-5a85-4519-a8e2-303abc321b0a"  // BuzzMarketing ES
]

async function main() {
    console.log('Iniciando eliminación de empresas gestoras (Tenants)...')

    for (const id of idsToDelete) {
        try {
            const setting = await prisma.settings.findUnique({
                where: { id },
                select: { companyName: true }
            })

            if (!setting) {
                console.log(`Settings con ID ${id} no encontrado.`)
                continue
            }

            console.log(`Eliminando: ${setting.companyName} (${id})...`)

            // Borrar datos relacionados manualmente ya que no hay Cascade en el schema para Settings
            // 1. Invoices
            const deletedInvoices = await prisma.invoice.deleteMany({ where: { settingsId: id } })
            console.log(` - Facturas eliminadas: ${deletedInvoices.count}`)

            // 2. Services / Templates
            const deletedServices = await prisma.service.deleteMany({ where: { settingsId: id } })
            console.log(` - Servicios eliminados: ${deletedServices.count}`)

            const deletedTemplates = await prisma.serviceTemplate.deleteMany({ where: { settingsId: id } })
            console.log(` - Plantillas eliminadas: ${deletedTemplates.count}`)

            // 3. Companies (Clientes) & Contacts (via cascade de Company o manual)
            // Contacts dependen de Company, y Company depende de Settings.
            // Primero buscamos las companies de este tenant para borrar sus contactos si no es cascade
            const tenantCompanies = await prisma.company.findMany({ where: { settingsId: id }, select: { id: true } })
            const companyIds = tenantCompanies.map(c => c.id)

            if (companyIds.length > 0) {
                const deletedContacts = await prisma.contact.deleteMany({ where: { companyId: { in: companyIds } } })
                console.log(` - Contactos eliminados: ${deletedContacts.count}`)
            }

            const deletedCompanies = await prisma.company.deleteMany({ where: { settingsId: id } })
            console.log(` - Clientes (Empresas) eliminados: ${deletedCompanies.count}`)

            // 4. Finalmente, borrar Settings
            await prisma.settings.delete({ where: { id } })
            console.log(`✅ ${setting.companyName} eliminado correctamente.`)
            console.log('-----------------------------------')

        } catch (error) {
            console.error(`❌ Error eliminando ${id}:`, error)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
