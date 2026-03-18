const fs = require('fs');
const path = 'src/actions/tasks-actions.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(/prisma\.task/g, '(prisma as any).task');
code = code.replace(/prismaLocal\.task/g, '(prismaLocal as any).task');
fs.writeFileSync(path, code);
console.log('Script finish');
