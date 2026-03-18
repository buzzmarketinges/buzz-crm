
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const sqlite = new Database(path.join(process.cwd(), 'prisma/dev.db'))

// Get all services
const services = sqlite.prepare('SELECT * FROM Service').all() as any[]
console.log(`Total services: ${services.length}`)

if (services.length > 0) {
    console.log('\nFirst service (all fields):')
    console.log(JSON.stringify(services[0], null, 2))

    console.log('\nAll service names and types:')
    services.forEach((s, i) => {
        console.log(`${i + 1}. ${s.name} - Type: ${s.type} - Active: ${s.isActive}`)
    })
}

// Save to file for inspection
fs.writeFileSync('services-dump.json', JSON.stringify(services, null, 2))
console.log('\nFull dump saved to services-dump.json')
