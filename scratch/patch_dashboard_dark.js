const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = [
  // StatCard function 
  ['className="rounded-2xl shadow-sm border-gray-200/80 group bg-white"', 'className="rounded-2xl shadow-sm border-gray-200/80 dark:border-zinc-800 group bg-white dark:bg-zinc-900"'],
  ['className="flex flex-row items-center justify-between pb-3 px-6 pt-6 border-b border-gray-50/50"', 'className="flex flex-row items-center justify-between pb-3 px-6 pt-6 border-b border-gray-50/50 dark:border-zinc-850"'],
  ['className="text-[12px] font-semibold tracking-wider uppercase text-gray-500"', 'className="text-[12px] font-semibold tracking-wider uppercase text-gray-500 dark:text-zinc-400"'],
  ['className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center"', 'className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center"'],
  ['className="h-4 w-4 text-gray-400"', 'className="h-4 w-4 text-gray-400 dark:text-zinc-500"'],
  ['className="text-3xl font-semibold tracking-tight text-gray-900"', 'className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100"'],
  ['className="h-9 w-20 bg-gray-100 animate-pulse rounded-lg"', 'className="h-9 w-20 bg-gray-100 dark:bg-zinc-800 animate-pulse rounded-lg"'],
  ['className="mt-2 text-[13px] font-medium text-gray-500"', 'className="mt-2 text-[13px] font-medium text-gray-500 dark:text-zinc-400"'],
  
  // Header
  ['text-[11px] font-medium text-orange-600 tracking-wider', 'text-[11px] font-medium text-orange-600 dark:text-orange-400 tracking-wider'],
  ['<h1 className="text-3xl font-semibold text-gray-900 tracking-tight">', '<h1 className="text-3xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">'],
  ['<p className="text-[14px] text-gray-500 mt-2 max-w-lg leading-relaxed">', '<p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-2 max-w-lg leading-relaxed">'],

  // Micro metrics 
  ['className="bg-white p-5 rounded-2xl border border-gray-200/80 flex items-center justify-between shadow-sm"', 'className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-sm"'],
  ['className="text-[11px] font-semibold uppercase tracking-wider text-gray-400"', 'className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500"'],
  ['className="text-[15px] font-semibold text-gray-900 mt-1"', 'className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 mt-1"'],
  ['className="h-5 w-5 text-gray-300"', 'className="h-5 w-5 text-gray-300 dark:text-zinc-600"'],

  // Main Chart
  ['className="rounded-3xl shadow-sm border-gray-200/80 overflow-hidden flex flex-col bg-white"', 'className="rounded-3xl shadow-sm border-gray-200/80 dark:border-zinc-800 overflow-hidden flex flex-col bg-white dark:bg-zinc-900"'],
  ['className="pb-6 p-6 border-b border-gray-50/50"', 'className="pb-6 p-6 border-b border-gray-50/50 dark:border-zinc-850"'],
  ['className="text-[15px] font-semibold flex items-center gap-2"', 'className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2"'],
  ['<p className="text-[13px] text-gray-500 mt-1">Interaction volume', '<p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Interaction volume'],
  
  // Awaiting data 
  ['className="h-full w-full flex flex-col items-center justify-center text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50"', 'className="h-full w-full flex flex-col items-center justify-center text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl bg-gray-50/50 dark:bg-zinc-950/40"'],
  ['<MessageSquare className="h-6 w-6 text-gray-300 mb-3" />', '<MessageSquare className="h-6 w-6 text-gray-300 dark:text-zinc-600 mb-3" />'],
  ['<h4 className="text-[14px] font-medium text-gray-900">Awaiting Data</h4>', '<h4 className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Awaiting Data</h4>'],
  ['<p className="text-[13px] text-gray-500 mt-1">Deploy your AI', '<p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Deploy your AI'],
  
  // Chart aesthetics adjustments (subtle)
  ['stroke="#9ca3af"', 'stroke="#6b7280"']
];

for (const [target, replacement] of replacements) {
  const cleanTarget = target.replace(/\r\n/g, '\n');
  const cleanReplacement = replacement.replace(/\r\n/g, '\n');
  
  if (content.includes(cleanTarget)) {
    content = content.split(cleanTarget).join(cleanReplacement);
  } else {
    const contentNormalized = content.replace(/\r\n/g, '\n');
    if (contentNormalized.includes(cleanTarget)) {
      content = contentNormalized.split(cleanTarget).join(cleanReplacement);
    } else {
      console.warn(`WARNING: Target not found in dashboard page: ${cleanTarget.substring(0, 50)}...`);
    }
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully updated Dashboard Analytics page with dark mode overrides!");
