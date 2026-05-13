const fs = require('fs');
const path = require('path');

const onboardingPath = path.join(__dirname, '../src/app/onboarding/page.tsx');
let content = fs.readFileSync(onboardingPath, 'utf-8').replace(/\r\n/g, '\n');

// Repair line 371 spill
const target1 = `className={\`text-[13px] sm:text-[14px] font-medium transition-colors duration-300 \${item.status === 'done' ? 'text-gray-800 dark:text-zinc-200' : item.status === 'active' ? 'text-black dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500'}\`}\``;
const repl1 = `className={\`text-[13px] sm:text-[14px] font-medium transition-colors duration-300 \${item.status === 'done' ? 'text-gray-800 dark:text-zinc-200' : item.status === 'active' ? 'text-black dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500'}\`}`;

if (content.includes(target1)) {
  content = content.split(target1).join(repl1);
  console.log('Repaired line 371 target successfully.');
} else {
  // Fallback check
  console.log('Searching alternative representation for line 371...');
  content = content.replace(/`\s*\}\}`\s*>/g, '`}>');
  console.log('Applied general bracket-backtick mitigation.');
}

// Repair line 506 spill
const target2 = `className={\`text-[12px] sm:text-[13px] font-semibold tracking-tight leading-tight \${isSel ? 'text-white' : 'text-gray-600 dark:text-zinc-300'}\`}\``;
const repl2 = `className={\`text-[12px] sm:text-[13px] font-semibold tracking-tight leading-tight \${isSel ? 'text-white' : 'text-gray-600 dark:text-zinc-300'}\`}`;

if (content.includes(target2)) {
  content = content.split(target2).join(repl2);
  console.log('Repaired line 506 target successfully.');
} else {
  // Apply simple substring replace if needed
  content = content.replace(/dark:text-zinc-300'\}\}\`/g, "dark:text-zinc-300'}");
  console.log('Applied line 506 general mitigation regex.');
}

fs.writeFileSync(onboardingPath, content, 'utf-8');
console.log('Writeback to onboarding/page.tsx completed.');
