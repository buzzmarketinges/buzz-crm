
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    try {
        const companies = await prisma.company.findMany({
            include: {
                invoices: true
            }
        })

        const report = companies.map(company => {
            const totalRevenue = company.invoices.reduce((sum, invoice) => {
                return sum + Number(invoice.totalAmount)
            }, 0)

            return {
                name: company.name,
                totalRevenue: totalRevenue,
                invoicesCount: company.invoices.length
            }
        })

        // Sort by revenue desc
        report.sort((a, b) => b.totalRevenue - a.totalRevenue)

        const outputPath = path.join(process.cwd(), 'revenue_report.json')
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8')

        console.log(`Report written to ${outputPath}`)

    } catch (error) {
        console.error('Error fetching data:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
