
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    try {
        const settings = await prisma.settings.findMany({
            select: {
                id: true,
                companyName: true,
                commercialName: true,
                companyTaxId: true,
                companyEmail: true,
                companies: {
                    select: {
                        id: true
                    }
                }
            }
        })

        const result = settings.map(s => ({
            "Nombre Empresa": s.companyName,
            "Nombre Comercial": s.commercialName || 'N/A',
            "CIF/NIF": s.companyTaxId || 'N/A',
            "Email": s.companyEmail || 'N/A',
            "Clientes gestionados": s.companies.length,
            "ID": s.id
        }))

        const outputPath = path.join(process.cwd(), 'my_tenants.json')
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')
        console.log(`Exportado a ${outputPath}`)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
