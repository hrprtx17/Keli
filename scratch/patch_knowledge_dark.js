const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/knowledge/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Let's do a comprehensive dark mode replace
const replacements = [
  // Header & selector
  ['text-[11px] font-medium text-orange-600 tracking-wider', 'text-[11px] font-medium text-orange-600 dark:text-orange-400 tracking-wider'],
  ['<h1 className="text-3xl font-semibold text-gray-900 tracking-tight">', '<h1 className="text-3xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">'],
  ['<p className="text-[14px] text-gray-500 mt-2 max-w-lg leading-relaxed">', '<p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-2 max-w-lg leading-relaxed">'],
  ['className="appearance-none bg-white border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-[14px] font-medium text-gray-800 shadow-sm', 'className="appearance-none bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg pl-10 pr-10 py-2.5 text-[14px] font-medium text-gray-800 dark:text-zinc-200 shadow-sm'],
  ['{!agents?.length && <option>No agents found</option>}', '{!agents?.length && <option className="dark:bg-zinc-900">No agents found</option>}'],
  ['{agents?.map((a: any) => (\n                   <option key={a._id} value={a._id}>{a.name}</option>\n                ))}', '{agents?.map((a: any) => (\n                   <option key={a._id} value={a._id} className="dark:bg-zinc-900">{a.name}</option>\n                ))}'],
  // Agent fallback container
  ['bg-white border border-gray-200/80 rounded-2xl p-12', 'bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-12'],
  ['bg-gray-50 rounded-xl flex items-center justify-center mb-4', 'bg-gray-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-4'],
  ['<Database className="w-6 h-6 text-gray-300" />', '<Database className="w-6 h-6 text-gray-300 dark:text-zinc-600" />'],
  ['<h3 className="text-[15px] font-medium text-gray-900">No agent selected</h3>', '<h3 className="text-[15px] font-medium text-gray-900 dark:text-zinc-100">No agent selected</h3>'],
  ['<p className="text-[14px] text-gray-500 mt-1">Please select an AI assistant', '<p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-1">Please select an AI assistant'],
  // Main system headings
  ['<h2 className="text-[16px] font-semibold text-gray-900">Add Training Data</h2>', '<h2 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">Add Training Data</h2>'],
  ['<p className="text-[14px] text-gray-500 mt-1">Upload documents', '<p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-1">Upload documents'],
  ['bg-white border border-gray-200/80 rounded-[20px] shadow-sm overflow-hidden group hover:border-orange-200', 'bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-[20px] shadow-sm overflow-hidden group hover:border-orange-200 dark:hover:border-orange-500/40'],
  // Drag drop
  ["isDragging \n                                      ? 'border-orange-400 bg-orange-50/50' \n                                      : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50/30'", "isDragging \n                                      ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20' \n                                      : 'border-gray-300 dark:border-zinc-700 hover:border-orange-300 dark:hover:border-orange-500/50 hover:bg-orange-50/30 dark:hover:bg-orange-950/10'"],
  ['${isDragging ? \'bg-orange-500 text-white\' : \'bg-gray-50 text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-100\'}', '${isDragging ? \'bg-orange-500 text-white\' : \'bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 group-hover:text-orange-500 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/40\'}'],
  ['<p className="text-[14px] font-medium text-gray-900">Drop files', '<p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Drop files'],
  ['<p className="text-[13px] text-gray-500 mt-1">PDF, DOCX, TXT', '<p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">PDF, DOCX, TXT'],
  // Button grid
  ['className="border border-gray-200 rounded-xl p-4 text-left flex items-start gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all hover:shadow-sm"', 'className="border border-gray-200 dark:border-zinc-800 rounded-xl p-4 text-left flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-zinc-950/50 hover:border-gray-300 dark:hover:border-zinc-700 transition-all hover:shadow-sm"'],
  ['bg-gray-50 border border-gray-100 text-gray-600 flex items-center justify-center shrink-0', 'bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-850 text-gray-600 dark:text-zinc-400 flex items-center justify-center shrink-0'],
  ['<h4 className="text-[14px] font-medium text-gray-900">Website Crawl</h4>', '<h4 className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Website Crawl</h4>'],
  ['<p className="text-[13px] text-gray-500 mt-0.5">Train your AI using pages', '<p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-0.5">Train your AI using pages'],
  ['className="border border-gray-200 rounded-xl p-4 text-left flex items-start gap-3 opacity-60 bg-gray-50/50 cursor-default"', 'className="border border-gray-200 dark:border-zinc-800 rounded-xl p-4 text-left flex items-start gap-3 opacity-60 bg-gray-50/50 dark:bg-zinc-950/30 cursor-default"'],
  ['bg-gray-100 border border-gray-100 text-gray-400 flex items-center justify-center shrink-0', 'bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 flex items-center justify-center shrink-0'],
  ['<h4 className="text-[14px] font-medium text-gray-900">Integrations</h4>', '<h4 className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Integrations</h4>'],
  ['<span className="text-[10px] font-medium bg-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded-md">Coming Soon</span>', '<span className="text-[10px] font-medium bg-gray-200/80 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-md">Soon</span>'],
  ['<p className="text-[13px] text-gray-500 mt-0.5">Connect tools like Notion', '<p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-0.5">Connect tools like Notion'],
  // Docs / Web tab views
  ['<h3 className="text-[14px] font-medium text-gray-900">Upload Document</h3>', '<h3 className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Upload Document</h3>'],
  ['<button onClick={resetState} className="text-[13px] text-gray-500 hover:text-gray-900">Cancel</button>', '<button onClick={resetState} className="text-[13px] text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white">Cancel</button>'],
  ['bg-gray-50 border border-gray-200/60 rounded-xl p-4 flex flex-col sm:flex-row', 'bg-gray-50 dark:bg-zinc-950 border border-gray-200/60 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row'],
  ['bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center shrink-0', 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm flex items-center justify-center shrink-0'],
  ['FileText className="w-5 h-5 text-gray-500"', 'FileText className="w-5 h-5 text-gray-500 dark:text-zinc-400"'],
  ['<h4 className="text-[14px] font-medium text-gray-900 truncate">{selectedFile?.name', '<h4 className="text-[14px] font-medium text-gray-900 dark:text-zinc-100 truncate">{selectedFile?.name'],
  ['<p className="text-[13px] text-gray-500">{formatSize', '<p className="text-[13px] text-gray-500 dark:text-zinc-400">{formatSize'],
  ['className="w-full sm:w-auto bg-gray-900 text-white h-9 px-5 rounded-lg font-medium text-[13px] hover:bg-gray-800 transition-all whitespace-nowrap shadow-sm"', 'className="w-full sm:w-auto bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 h-9 px-5 rounded-lg font-medium text-[13px] hover:bg-gray-800 dark:hover:bg-white transition-all whitespace-nowrap shadow-sm"'],
  ['className="flex items-center gap-2 bg-white px-4 h-9 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-900 whitespace-nowrap shadow-sm"', 'className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-[13px] font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap shadow-sm"'],
  // Website crawl tab
  ['<h3 className="text-[14px] font-medium text-gray-900">Website Crawl</h3>', '<h3 className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Website Crawl</h3>'],
  ['className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-[120px] py-2.5 text-[14px] outline-none focus:bg-white focus:border-orange-400 focus:ring-[3px] focus:ring-orange-500/10 transition-all"', 'className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg pl-10 pr-[120px] py-2.5 text-[14px] text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-orange-400 focus:ring-[3px] focus:ring-orange-500/10 transition-all"'],
  ['className="bg-gray-900 text-white h-7 px-3 rounded-md font-medium text-[12px] hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"', 'className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 h-7 px-3 rounded-md font-medium text-[12px] hover:bg-gray-800 dark:hover:bg-white disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"'],
  ['<p className="text-[12px] text-gray-500 mt-2 px-1 flex items-center gap-1.5">', '<p className="text-[12px] text-gray-500 dark:text-zinc-400 mt-2 px-1 flex items-center gap-1.5">'],
  // Progress box
  ['<div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm mt-4">', '<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[20px] p-5 shadow-sm mt-4">'],
  ['<div className="flex items-center gap-2 text-[13px] font-medium text-gray-900">', '<div className="flex items-center gap-2 text-[13px] font-medium text-gray-900 dark:text-zinc-100">'],
  ['<div className="text-[12px] text-gray-500">{ingestStage}...</div>', '<div className="text-[12px] text-gray-500 dark:text-zinc-400">{ingestStage}...</div>'],
  ['<div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden relative">', '<div className="w-full bg-gray-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden relative">'],
  ['<div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">', '<div className="w-full bg-gray-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">'],
  // Connected sources headings
  ['<h2 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">Connected Sources</h2>', '<h2 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">Connected Sources</h2>'],
  ['<p className="text-[14px] text-gray-500 mt-1">Content currently used', '<p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-1">Content currently used'],
  ['<div className="bg-white border border-gray-200/80 rounded-[20px] shadow-sm overflow-hidden">', '<div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-[20px] shadow-sm overflow-hidden">'],
  ['<tr className="text-[12px] font-medium text-gray-500 border-b border-gray-100 bg-gray-50/50">', '<tr className="text-[12px] font-medium text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-zinc-950/50">'],
  ['<tbody className="divide-y divide-gray-50">', '<tbody className="divide-y divide-gray-50 dark:divide-zinc-850">'],
  // Table content
  ['<td colSpan={4} className="px-6 py-4"><div className="h-5 bg-gray-100 rounded w-1/2" /></td>', '<td colSpan={4} className="px-6 py-4"><div className="h-5 bg-gray-100 dark:bg-zinc-800 rounded w-1/2" /></td>'],
  ['bg-gray-50 rounded-full flex items-center justify-center mb-3', 'bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3'],
  ['<Database className="w-5 h-5 text-gray-400" />', '<Database className="w-5 h-5 text-gray-400 dark:text-zinc-600" />'],
  ['<p className="text-[14px] font-medium text-gray-900">No training data yet</p>', '<p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">No training data yet</p>'],
  ['<p className="text-[13px] text-gray-500 mt-1 max-w-[240px]">', '<p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1 max-w-[240px]">'],
  ['className="mt-4 text-[13px] font-medium text-orange-600 hover:text-orange-700 hover:underline transition-colors"', 'className="mt-4 text-[13px] font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline transition-colors"'],
  // Rows
  ['className="hover:bg-gray-50/50 transition-colors group"', 'className="hover:bg-gray-50/50 dark:hover:bg-zinc-950/50 transition-colors group"'],
  ['className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${isUrl ? \'bg-white border-gray-200 text-gray-500\' : \'bg-white border-gray-200 text-gray-500\'}`}', 'className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${isUrl ? \'bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-850 text-gray-500 dark:text-zinc-400\' : \'bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-850 text-gray-500 dark:text-zinc-400\'}`}'],
  ['<p className="text-[13px] font-medium text-gray-900 truncate max-w-[200px]">{source.name}</p>', '<p className="text-[13px] font-medium text-gray-900 dark:text-zinc-100 truncate max-w-[200px]">{source.name}</p>'],
  ['<p className="text-[12px] text-gray-500 flex items-center gap-1 mt-0.5">', '<p className="text-[12px] text-gray-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">'],
  ['<span className="text-[13px] text-gray-600">Trained</span>', '<span className="text-[13px] text-gray-600 dark:text-zinc-300">Trained</span>'],
  ['<span className="text-[13px] text-gray-600">Training...</span>', '<span className="text-[13px] text-gray-600 dark:text-zinc-300">Training...</span>'],
  ['<div className="text-[13px] text-gray-500">', '<div className="text-[13px] text-gray-500 dark:text-zinc-400">'],
  // Table action icons
  ['className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"', 'className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"'],
  ['className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"', 'className="p-1.5 rounded-md text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"'],
  // AI Configuration mini sidebar box
  ['className="bg-white border border-gray-200/80 rounded-[20px] p-6 shadow-sm"', 'className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-[20px] p-6 shadow-sm"'],
  ['<h4 className="text-[14px] font-semibold text-gray-900 mb-4">AI Configuration</h4>', '<h4 className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100 mb-4">AI Configuration</h4>'],
  ['className="flex justify-between items-center text-[13px] border-b border-gray-50 pb-2.5 last:border-0 last:pb-0"', 'className="flex justify-between items-center text-[13px] border-b border-gray-50 dark:border-zinc-850 pb-2.5 last:border-0 last:pb-0"'],
  ['<span className="text-gray-500">{inf.t}</span>', '<span className="text-gray-500 dark:text-zinc-400">{inf.t}</span>'],
  ['<span className="text-gray-900 font-medium">{inf.v}</span>', '<span className="text-gray-900 dark:text-zinc-100 font-medium">{inf.v}</span>']
];

for (const [target, replacement] of replacements) {
  // Do safe replacement, normalized for carriage returns
  const cleanTarget = target.replace(/\r\n/g, '\n');
  const cleanReplacement = replacement.replace(/\r\n/g, '\n');
  
  if (content.includes(cleanTarget)) {
    content = content.split(cleanTarget).join(cleanReplacement);
  } else {
    // Fallback: try replacing carriage-return normalized content
    const contentNormalized = content.replace(/\r\n/g, '\n');
    if (contentNormalized.includes(cleanTarget)) {
      content = contentNormalized.split(cleanTarget).join(cleanReplacement);
    } else {
      console.warn(`WARNING: Target not found in knowledge page: ${cleanTarget.substring(0, 50)}...`);
    }
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully updated Knowledge page with dark mode overrides!");
