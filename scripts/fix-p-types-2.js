const fs = require('fs');
const path = 'src/actions/tasks-actions.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace settings notificationEmail
code = code.replace(/setting\.notificationEmail/g, '(setting as any).notificationEmail');

// Replace t => t.settingsId with (t: any) => t.settingsId
code = code.replace(/t\s*=>\s*t\.settingsId/g, '(t: any) => t.settingsId');

// Just to be sure for other Prisma tags
code = code.replace(/prisma\.task/g, '(prisma as any).task');
code = code.replace(/prismaLocal\.task/g, '(prismaLocal as any).task');

fs.writeFileSync(path, code);
console.log('Script finish');
