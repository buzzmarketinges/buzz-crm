import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getTenantId } from "@/lib/tenant"
import fs from "fs"
import JSZip from "jszip"
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf"


export async function POST(req: NextRequest) {
    try {
        const { startDate, endDate, clientId, ids } = await req.json()
        const tenantId = await getTenantId()

        const where: any = {
            settingsId: tenantId,
        }

        if (ids && Array.isArray(ids) && ids.length > 0) {
            // Direct selection mode
            where.id = { in: ids }
        } else {
            // Filter mode
            where.status = { not: 'DRAFT' }

            if (startDate) {
                where.issueDate = { ...where.issueDate, gte: new Date(startDate) }
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                where.issueDate = { ...where.issueDate, lte: end }
            }
            if (clientId && clientId !== 'all') {
                where.companyId = clientId
            }
        }

        const invoices = await prisma.invoice.findMany({
            where,

            select: {
                id: true,
                number: true,
                pdfPath: true
            }
        })

        if (invoices.length === 0) {
            return new NextResponse(JSON.stringify({ error: "No se encontraron facturas en el periodo seleccionado" }), { status: 404 })
        }

        const zip = new JSZip()
        let addedCount = 0

        for (const inv of invoices) {
            try {
                // Try to use the utility which handles regeneration
                const content = await generateInvoicePdfBuffer(inv.id)
                zip.file(`${inv.number}.pdf`, content)
                addedCount++
            } catch (err) {
                console.error(`Failed to add invoice ${inv.number} to ZIP:`, err)
            }
        }

        if (addedCount === 0) {
            return new NextResponse(JSON.stringify({ error: "No se pudieron generar los archivos PDF para las facturas seleccionadas" }), { status: 404 })
        }


        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

        return new NextResponse(zipBuffer as any, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="facturas.zip"`
            }
        })

    } catch (error) {
        console.error("ZIP Generation Error:", error)
        return new NextResponse(JSON.stringify({ error: "Error interno al generar ZIP" }), { status: 500 })
    }
}
