
import { PrismaClient } from '@prisma/client'
import Database from 'better-sqlite3'
import path from 'path'

const prisma = new PrismaClient()
const sqlite = new Database(path.join(process.cwd(), 'prisma/dev.db'))

async function main() {
    console.log('Starting migration from SQLite to Postgres...')

    // 1. Migrate Users
    try {
        const users = sqlite.prepare('SELECT * FROM User').all() as any[]
        console.log(`Found ${users.length} users in SQLite`)

        for (const u of users) {
            await prisma.user.upsert({
                where: { email: u.email },
                update: {
                    password: u.password,
                    name: u.name,
                },
                create: {
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    password: u.password,
                }
            })
        }
        console.log('Users migrated.')
    } catch (e) {
        console.error('Error migrating users:', e)
    }

    // 2. Migrate Settings (Tenants)
    try {
        const oldSettings = sqlite.prepare('SELECT * FROM Settings').all() as any[]
        console.log(`Found ${oldSettings.length} settings in SQLite`)

        for (const s of oldSettings) {
            const companyAddress = s.companyAddress || 'Dirección por defecto'
            const taxIdLabel = s.taxIdLabel || 'NIF'

            await prisma.settings.upsert({
                where: { id: s.id },
                update: {
                    companyName: s.companyName,
                    companyAddress: companyAddress,
                    invoicePrefix: s.invoicePrefix,
                },
                create: {
                    id: s.id,
                    companyName: s.companyName,
                    companyAddress: companyAddress,
                    invoicePrefix: s.invoicePrefix,
                    taxIdLabel: taxIdLabel,
                    localSavePath: s.localSavePath || 'C:/Facturas'
                }
            })
        }
        console.log('Settings migrated.')
    } catch (e) {
        console.error('Error migrating settings:', e)
    }

    // 3. Migrate Companies (Clients)
    try {
        const companies = sqlite.prepare('SELECT * FROM Company').all() as any[]
        console.log(`Found ${companies.length} companies`)
        for (const c of companies) {
            await prisma.company.upsert({
                where: { id: c.id },
                update: {
                    name: c.name,
                    businessName: c.businessName || c.name,
                    taxId: c.taxId || 'N/A',
                    address: c.address,
                    billingEmail: c.billingEmail || c.email || 'no-email@example.com',
                    settingsId: c.settingsId || 'default'
                },
                create: {
                    id: c.id,
                    name: c.name,
                    businessName: c.businessName || c.name,
                    taxId: c.taxId || 'N/A',
                    address: c.address,
                    billingEmail: c.billingEmail || c.email || 'no-email@example.com',
                    settingsId: c.settingsId || 'default'
                }
            })
        }
        console.log('Companies migrated.')
    } catch (e) {
        console.error('Error migrating companies:', e)
    }

    // 4. Migrate ServiceTemplates
    try {
        const templates = sqlite.prepare('SELECT * FROM ServiceTemplate').all() as any[]
        console.log(`Found ${templates.length} service templates`)
        for (const t of templates) {
            await prisma.serviceTemplate.upsert({
                where: { id: t.id },
                update: {
                    name: t.name,
                    settingsId: t.settingsId || 'default'
                },
                create: {
                    id: t.id,
                    name: t.name,
                    settingsId: t.settingsId || 'default'
                }
            })
        }
        console.log('ServiceTemplates migrated.')
    } catch (e) {
        console.error('Error migrating templates:', e)
    }

    // 5. Migrate Services
    try {
        const services = sqlite.prepare('SELECT * FROM Service').all() as any[]
        console.log(`Found ${services.length} services`)

        for (const s of services) {
            const isActive = s.active === 1 || s.active === 'true' || s.active === true;
            const isRecurring = s.billingCycle && s.billingCycle !== 'none';
            // Fallback for price if it's missing or strangely formatted (though it should be a number in sqlite)
            const price = s.price || 0;

            await prisma.service.upsert({
                where: { id: s.id },
                update: {
                    name: s.description || 'Servicio sin nombre',
                    description: s.description,
                    price: price,
                    type: isRecurring ? 'RECURRENTE' : 'PUNTUAL',
                    isActive: isActive,
                    companyId: s.companyId,
                    settingsId: s.settingsId || 'default'
                },
                create: {
                    id: s.id,
                    name: s.description || 'Servicio sin nombre',
                    description: s.description,
                    price: price,
                    type: isRecurring ? 'RECURRENTE' : 'PUNTUAL',
                    isActive: isActive,
                    companyId: s.companyId,
                    settingsId: s.settingsId || 'default'
                }
            })
        }
        console.log('Services migrated.')
    } catch (e) {
        console.error('Error migrating services:', e)
    }

    // 6. Migrate Invoices
    try {
        const invoices = sqlite.prepare('SELECT * FROM Invoice').all() as any[]
        console.log(`Found ${invoices.length} invoices`)
        for (const i of invoices) {
            const isArchived = i.isArchived === 1 || i.isArchived === 'true' || i.isArchived === true;

            await prisma.invoice.upsert({
                where: { id: i.id },
                update: {
                    number: i.number,
                    issueDate: new Date(i.issueDate),
                    status: i.status || 'DRAFT',
                    items: i.items || '[]',
                    subtotal: i.subtotal || 0,
                    taxAmount: i.taxAmount || 0,
                    totalAmount: i.totalAmount || 0,
                    isArchived: isArchived,
                    companyId: i.companyId,
                    settingsId: i.settingsId || 'default'
                },
                create: {
                    id: i.id,
                    number: i.number,
                    issueDate: new Date(i.issueDate),
                    status: i.status || 'DRAFT',
                    items: i.items || '[]',
                    subtotal: i.subtotal || 0,
                    taxAmount: i.taxAmount || 0,
                    totalAmount: i.totalAmount || 0,
                    isArchived: isArchived,
                    companyId: i.companyId,
                    settingsId: i.settingsId || 'default'
                }
            })
        }
        console.log('Invoices migrated.')
    } catch (e) {
        console.error('Error migrating invoices:', e)
    }

    console.log('Migration complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        sqlite.close()
    })
