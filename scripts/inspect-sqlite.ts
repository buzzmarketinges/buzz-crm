
import Database from 'better-sqlite3'
import path from 'path'

const sqlite = new Database(path.join(process.cwd(), 'prisma/dev.db'))

const service = sqlite.prepare('SELECT * FROM Service LIMIT 1').get()
console.log('Service Row:', JSON.stringify(service, null, 2))

const template = sqlite.prepare('SELECT * FROM ServiceTemplate LIMIT 1').get()
console.log('Template Row:', JSON.stringify(template, null, 2))
