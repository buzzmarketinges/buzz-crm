
import { PrismaClient } from '@prisma/client'
import path from 'path'

// Hardcode the url to match the application's forced path to ensure we write to the EXACT same DB
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`
        }
    }
})

const clients = [
    {
        name: "Activa valles",
        businessName: "ACTIVIATS ASSOCIACIÓ VILLAGE ACTIVITATS JUVENILS",
        taxId: "G67200048",
        address: "Carrer de Budapest, 81 - 08206 - SABADELL",
        billingEmail: "activa@buzzmarketing.test"
    },
    {
        name: "Bermaq",
        businessName: "Worldmaq-3, S.L.",
        taxId: "B65688962",
        address: "Moli del Castell S/N Avià, 08610 Barcelona",
        billingEmail: "bermaq@buzzmarketing.test"
    },
    {
        name: "Club Bàsquet Hospitalet",
        businessName: "Club Basquet L'Hospitalet",
        taxId: "G5801009",
        address: "",
        billingEmail: "cbhospitalet@buzzmarketing.test"
    },
    {
        name: "Club Futbol Base Sant Pere Pescador",
        businessName: "G17810003",
        taxId: "G17810003",
        address: "Avinguda Onze de Setembre (Camí del Bussinyol) 17470, Sant Pere Pescador, Girona",
        billingEmail: "santperepescador@buzzmarketing.test"
    },
    {
        name: "Francisco Javier Trinidad Martínez",
        businessName: "Francisco Javier Trinidad Martínez",
        taxId: "43535879F",
        address: "Rambla del Carmelo 80 08032, Barcelona",
        billingEmail: "francisco.trinidad@buzzmarketing.test"
    },
    {
        name: "Palacio del bebé",
        businessName: "Rosmelys López Tovar",
        taxId: "Z1348853T",
        address: "Carrer de Colom 53, 08201 Sabadell",
        billingEmail: "palaciobebe1@buzzmarketing.test"
    },
    {
        name: "Palacio del bebé",
        businessName: "Baby Palace S.L.U",
        taxId: "B62686290",
        address: "Gran Via de les Corts Catalanes nº 631, 08010 Barcelona",
        billingEmail: "palaciobebe2@buzzmarketing.test"
    },
    {
        name: "Segarra I Olive",
        businessName: "Segarra I Olive Advocats Associats Scp",
        taxId: "J60367281",
        address: "Avenida Rei en Jaume, 70, cardedeu, 08440, Barcelona",
        billingEmail: "segarra@buzzmarketing.test"
    },
    {
        name: "Sweet Care",
        businessName: "Flora Ancari Ch",
        taxId: "26539395V",
        address: "",
        billingEmail: "sweetcare@buzzmarketing.test"
    },
    {
        name: "Tagtio",
        businessName: "Kyomu Marketing Sl",
        taxId: "B17981713",
        address: "Calle Pic de Peguera, 11, Girona, 17003",
        billingEmail: "tagtio@buzzmarketing.test"
    },
    {
        name: "Tattoox",
        businessName: "Tattoox SL",
        taxId: "B67709097",
        address: "C/ Llull, 51; 08005 Barcelona",
        billingEmail: "tattoox@buzzmarketing.test"
    }
]

async function main() {
    console.log(`Cleaning old data...`)
    // Delete all existing companies to avoid duplicates and ensure clean state
    await prisma.invoice.deleteMany({})
    await prisma.company.deleteMany({})

    console.log(`Start seeding ${clients.length} clients...`)

    for (const client of clients) {
        // Explicitly handle nulls just in case, though the array above is clean
        const data = {
            ...client,
            address: client.address || "",
            billingEmail: client.billingEmail || ""
        }
        const result = await prisma.company.create({ data })
        console.log(`Created client: ${result.name}`)
    }

    const count = await prisma.company.count()
    console.log(`Seeding finished. Total clients: ${count}`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
