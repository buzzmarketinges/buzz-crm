import { getProjectReport, getProject } from '../src/actions/projects-actions'
import { getServices } from '../src/actions/service-actions'

async function main() {
    const projectId = '28c9d8c5-3746-4dc5-8f6a-0be2aef5ad6a' // or any active project ID
    // Wait, let's just find first Project ID in DB so I can use it to test.
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    const p = await prisma.project.findFirst()
    if (!p) {
        console.log('No project found')
        return
    }

    console.time('getProjectReport')
    await getProjectReport(p.id)
    console.timeEnd('getProjectReport')

    console.time('getServices')
    await getServices(p.companyId)
    console.timeEnd('getServices')

    console.time('getProject')
    await getProject(p.id)
    console.timeEnd('getProject')
}

main().catch(console.error)
