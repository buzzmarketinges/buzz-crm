
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const clients = [
    {
        name: "Activa valles",
        businessName: "ACTIVIATS ASSOCIACIÓ VILLAGE ACTIVITATS JUVENILS",
        taxId: "G67200048",
        address: "Carrer de Budapest, 81 - 08206 - SABADELL",
        billingEmail: "facturacion@activavalles.com"
    },
    {
        name: "Bermaq",
        businessName: "Worldmaq-3, S.L.",
        taxId: "B65688962",
        address: "Moli del Castell S/N Avià, 08610 Barcelona",
        billingEmail: "facturacion@bermaq.com"
    },
    {
        name: "Club Bàsquet Hospitalet",
        businessName: "Club Basquet L'Hospitalet",
        taxId: "G5801009",
        address: "",
        billingEmail: "info@cbhospitalet.com"
    },
    {
        name: "Club Futbol Base Sant Pere Pescador",
        businessName: "Club Futbol Base Sant Pere Pescador",
        taxId: "G17810003",
        address: "Avinguda Onze de Setembre (Camí del Bussinyol) 17470, Sant Pere Pescador, Girona, Espanya",
        billingEmail: "info@cfbsantpere.com"
    },
    {
        name: "Clustag",
        businessName: "Clustag",
        taxId: "PENDIENTE-CLUSTAG",
        address: "",
        billingEmail: "facturacion@clustag.com"
    },
    {
        name: "Covides",
        businessName: "Covides",
        taxId: "PENDIENTE-COVIDES",
        address: "",
        billingEmail: "facturacion@covides.com"
    },
    {
        name: "Francisco Javier Trinidad Martínez",
        businessName: "Francisco Javier Trinidad Martínez",
        taxId: "43535879F",
        address: "Rambla del Carmelo 80 08032, Barcelona",
        billingEmail: "javier@email.com"
    },
    {
        name: "Hermanos Tapar SL",
        businessName: "Hermanos Tapar SL",
        taxId: "B71505663",
        address: "C/ de Sant Josep de la Guineueta 4 08003, Barcelona, España",
        billingEmail: "facturacion@hermanostapar.com"
    },
    {
        name: "Palacio del bebé",
        businessName: "Baby Palace S.L.U",
        taxId: "B62686290",
        address: "Gran Vía de les Corts Catalanes nº 631, 08010 Barcelona",
        billingEmail: "facturacion@palaciodelbebe.com"
    },
    {
        name: "Ros Studio",
        businessName: "Rosmelys López Tovar",
        taxId: "Z1348853T",
        address: "Carrer de Colom 53, 08201 Sabadell",
        billingEmail: "ros@studio.com"
    },
    {
        name: "Segarra I Olive",
        businessName: "Segarra I Olive Advocats Associats Scp",
        taxId: "J60367281",
        address: "Avenida Rei en Jaume, 70, cardedeu, 08440, Barcelona",
        billingEmail: "info@segarraiolive.com"
    },
    {
        name: "Sweet Care",
        businessName: "Flora Ancari Ch",
        taxId: "26539395V",
        address: "",
        billingEmail: "flora@sweetcare.com"
    },
    {
        name: "Tagtio",
        businessName: "Kyomu Marketing Sl",
        taxId: "B17981713",
        address: "Calle Pic de Peguera, 11, Girona, 17003",
        billingEmail: "facturacion@tagtio.com"
    },
    {
        name: "Tattoox",
        businessName: "Tattoox SL",
        taxId: "B67709097",
        address: "C/ Llull, 51; 08005 Barcelona",
        billingEmail: "facturacion@tattoox.com"
    },
    {
        name: "Voltura projects",
        businessName: "Voltura projects",
        taxId: "PENDIENTE-VOLTURA",
        address: "",
        billingEmail: "info@voltura.com"
    }
]

async function main() {
    console.log(`Start seeding ${clients.length} clients...`)
    for (const client of clients) {
        // Check if exists by TAX ID (if not pending) or Name
        let exists = null
        if (!client.taxId.startsWith('PENDIENTE')) {
            exists = await prisma.company.findFirst({ where: { taxId: client.taxId } })
        } else {
            exists = await prisma.company.findFirst({ where: { name: client.name } })
        }

        if (!exists) {
            await prisma.company.create({
                data: {
                    name: client.name,
                    businessName: client.businessName,
                    taxId: client.taxId,
                    address: client.address,
                    billingEmail: client.billingEmail
                }
            })
            console.log(`Created: ${client.name}`)
        } else {
            console.log(`Skipped (Exists): ${client.name}`)
        }
    }
    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
