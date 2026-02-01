
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');

async function backup() {
    // 1. Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`Created backup directory at ${BACKUP_DIR}`);
    }

    // 2. Check if DB exists
    if (!fs.existsSync(DB_PATH)) {
        console.warn(`No database found at ${DB_PATH}. Skipping backup.`);
        return;
    }

    // 3. Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `buzz-crm-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    // 4. Copy file
    try {
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`✅ Database backed up to: ${backupName}`);

        // Optional: Keep only last 50 backups?
        cleanOldBackups();
    } catch (error) {
        console.error("❌ Backup failed:", error);
    }
}

function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.db'))
            .map(f => ({
                name: f,
                path: path.join(BACKUP_DIR, f),
                time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // Newest first

        const KEEP_COUNT = 20; // Keep last 20 backups
        if (files.length > KEEP_COUNT) {
            const toDelete = files.slice(KEEP_COUNT);
            toDelete.forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`Cleaned up old backup: ${file.name}`);
            });
        }
    } catch (e) {
        console.warn("Cleanup warning:", e);
    }
}

backup();
