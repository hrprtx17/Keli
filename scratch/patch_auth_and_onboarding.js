const fs = require('fs');
const path = require('path');

// Helper to safely patch a file with normalization
function patchFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`WARNING: File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;
  
  for (const [target, replacement] of replacements) {
    const cleanTarget = target.replace(/\r\n/g, '\n');
    const cleanReplacement = replacement.replace(/\r\n/g, '\n');
    
    if (content.includes(cleanTarget)) {
      content = content.split(cleanTarget).join(cleanReplacement);
      modified = true;
    } else {
      const contentNormalized = content.replace(/\r\n/g, '\n');
      if (contentNormalized.includes(cleanTarget)) {
        content = contentNormalized.split(cleanTarget).join(cleanReplacement);
        modified = true;
      } else {
        console.warn(`WARNING: Failed to find target in ${filePath}:\n"${cleanTarget.substring(0, 60)}..."`);
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Successfully patched ${filePath}`);
  } else {
    console.log(`No changes applied to ${filePath}`);
  }
}

// ============================================================================
// 1. PATCH LOGIN
// ============================================================================
patchFile('../src/app/login/page.tsx', [
  ['className="relative min-h-screen w-full flex bg-[#F8F8F8] text-[#1A1A1A] antialiased selection:bg-orange-100 selection:text-orange-700 overflow-hidden"', 'className="relative min-h-screen w-full flex bg-[#F8F8F8] dark:bg-zinc-950 text-[#1A1A1A] dark:text-zinc-100 antialiased selection:bg-orange-100 selection:text-orange-700 overflow-hidden"'],
  ['style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: \'24px 24px\' }}', 'className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" \n          style={{ backgroundImage: `radial-gradient(var(--foreground, #000) 1px, transparent 1px)`, backgroundSize: \'24px 24px\' }}`'],
  ['className="flex w-full md:w-[45%] lg:w-[40%] items-center justify-center p-6 sm:p-8 relative z-10 bg-white shadow-2xl shadow-black/[0.02] border-r border-gray-100"', 'className="flex w-full md:w-[45%] lg:w-[40%] items-center justify-center p-6 sm:p-8 relative z-10 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/[0.02] border-r border-gray-100 dark:border-zinc-800"'],
  ['<span className="font-semibold text-lg tracking-tight text-black">AgentDesk</span>', '<span className="font-semibold text-lg tracking-tight text-black dark:text-zinc-100">AgentDesk</span>'],
  ['<h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-[1.1]">Welcome back</h1>', '<h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-[1.1]">Welcome back</h1>'],
  ['<p className="mt-2 text-sm font-medium text-gray-500">', '<p className="mt-2 text-sm font-medium text-gray-500 dark:text-zinc-400">'],
  ['<Label htmlFor="email" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500">Work Email</Label>', '<Label htmlFor="email" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">Work Email</Label>'],
  ['className="h-11 rounded-xl bg-gray-50/50 border-gray-200 px-4 focus:ring-[3px] focus:ring-orange-500/10 transition-all outline-none"', 'className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 px-4 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:ring-[3px] focus:ring-orange-500/10 transition-all outline-none"'],
  ['<Label htmlFor="password" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500">Password</Label>', '<Label htmlFor="password" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">Password</Label>'],
  ['className="w-full h-11 rounded-xl bg-black text-white hover:bg-zinc-800 hover:shadow-md font-semibold text-[14px] transition-all duration-200 active:scale-[0.99]"', 'className="w-full h-11 rounded-xl bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white hover:shadow-md font-semibold text-[14px] transition-all duration-200 active:scale-[0.99]"'],
  ['className="flex-1 border-t border-gray-100"', 'className="flex-1 border-t border-gray-100 dark:border-zinc-800"'],
  ['className="w-full h-11 rounded-xl border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 text-[14px] font-semibold transition-all shadow-sm active:scale-[0.99]"', 'className="w-full h-11 rounded-xl border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2 text-[14px] font-semibold transition-all shadow-sm active:scale-[0.99] dark:text-zinc-200"'],
  ['<p className="text-center text-[13px] font-medium text-gray-500">', '<p className="text-center text-[13px] font-medium text-gray-500 dark:text-zinc-400">'],
  ['<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/[0.04] rounded-full blur-[120px]" />', '<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/[0.04] dark:bg-orange-500/[0.08] rounded-full blur-[120px]" />'],
  ['className="inline-flex items-center justify-center rounded-[24px] bg-white p-5 shadow-xl shadow-black/[0.02] border border-gray-100 mx-auto"', 'className="inline-flex items-center justify-center rounded-[24px] bg-white dark:bg-zinc-900 p-5 shadow-xl shadow-black/[0.02] border border-gray-100 dark:border-zinc-800 mx-auto"'],
  ['<h2 className="text-[32px] lg:text-[40px] font-bold tracking-tight text-gray-900 leading-[1.15]">', '<h2 className="text-[32px] lg:text-[40px] font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-[1.15]">'],
  ['<p className="text-[15px] font-medium text-gray-500 max-w-md mx-auto leading-relaxed">', '<p className="text-[15px] font-medium text-gray-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">'],
  ['className="rounded-[16px] border border-gray-200/80 bg-white p-3.5 shadow-sm hover:shadow-md transition-shadow"', 'className="rounded-[16px] border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-sm hover:shadow-md transition-shadow"']
]);

// ============================================================================
// 2. PATCH REGISTER
// ============================================================================
patchFile('../src/app/register/page.tsx', [
  ['className="relative min-h-screen w-full flex bg-[#F8F8F8] text-[#1A1A1A] antialiased selection:bg-orange-100 selection:text-orange-700 overflow-hidden"', 'className="relative min-h-screen w-full flex bg-[#F8F8F8] dark:bg-zinc-950 text-[#1A1A1A] dark:text-zinc-100 antialiased selection:bg-orange-100 selection:text-orange-700 overflow-hidden"'],
  ['style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: \'24px 24px\' }}', 'className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" \n          style={{ backgroundImage: `radial-gradient(var(--foreground, #000) 1px, transparent 1px)`, backgroundSize: \'24px 24px\' }}`'],
  ['className="flex w-full md:w-[45%] lg:w-[40%] items-center justify-center p-6 sm:p-8 relative z-10 bg-white shadow-2xl shadow-black/[0.02] border-r border-gray-100"', 'className="flex w-full md:w-[45%] lg:w-[40%] items-center justify-center p-6 sm:p-8 relative z-10 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/[0.02] border-r border-gray-100 dark:border-zinc-800"'],
  ['<span className="font-semibold text-lg tracking-tight text-black">AgentDesk</span>', '<span className="font-semibold text-lg tracking-tight text-black dark:text-zinc-100">AgentDesk</span>'],
  ['<h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-[1.1]">Create your account</h1>', '<h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-[1.1]">Create your account</h1>'],
  ['<p className="mt-2 text-sm font-medium text-gray-500">', '<p className="mt-2 text-sm font-medium text-gray-500 dark:text-zinc-400">'],
  ['className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-[13px] font-medium text-red-600', 'className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/30 px-4 py-3 text-[13px] font-medium text-red-600 dark:text-red-400'],
  ['<Label htmlFor="name" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500">Full Name</Label>', '<Label htmlFor="name" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">Full Name</Label>'],
  ['className="h-11 rounded-xl bg-gray-50/50 border-gray-200 px-4 focus:ring-[3px] focus:ring-orange-500/10 transition-all outline-none"', 'className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 px-4 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:ring-[3px] focus:ring-orange-500/10 transition-all outline-none"'],
  ['<Label htmlFor="email" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500">Work Email</Label>', '<Label htmlFor="email" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">Work Email</Label>'],
  ['<Label htmlFor="password" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500">Password</Label>', '<Label htmlFor="password" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">Password</Label>'],
  ['className="h-11 rounded-xl bg-gray-50/50 border-gray-200 pl-4 pr-11 focus:ring-[3px] focus:ring-orange-500/10 transition-all outline-none"', 'className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 pl-4 pr-11 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:ring-[3px] focus:ring-orange-500/10 transition-all outline-none"'],
  ['className="w-full h-11 rounded-xl bg-black text-white hover:bg-zinc-800 hover:shadow-md font-semibold text-[14px] transition-all duration-200 active:scale-[0.99] mt-2"', 'className="w-full h-11 rounded-xl bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white hover:shadow-md font-semibold text-[14px] transition-all duration-200 active:scale-[0.99] mt-2"'],
  ['className="flex-1 border-t border-gray-100"', 'className="flex-1 border-t border-gray-100 dark:border-zinc-800"'],
  ['className="w-full h-11 rounded-xl border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 text-[14px] font-semibold transition-all shadow-sm active:scale-[0.99]"', 'className="w-full h-11 rounded-xl border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2 text-[14px] font-semibold transition-all shadow-sm active:scale-[0.99] dark:text-zinc-200"'],
  ['<p className="text-center text-[13px] font-medium text-gray-500">', '<p className="text-center text-[13px] font-medium text-gray-500 dark:text-zinc-400">'],
  ['className="inline-flex items-center justify-center rounded-[24px] bg-white p-5 shadow-xl shadow-black/[0.02] border border-gray-100 mx-auto"', 'className="inline-flex items-center justify-center rounded-[24px] bg-white dark:bg-zinc-900 p-5 shadow-xl shadow-black/[0.02] border border-gray-100 dark:border-zinc-800 mx-auto"'],
  ['<h2 className="text-[32px] lg:text-[40px] font-bold tracking-tight text-gray-900 leading-[1.15]">', '<h2 className="text-[32px] lg:text-[40px] font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-[1.15]">'],
  ['<p className="text-[15px] font-medium text-gray-500 max-w-md mx-auto leading-relaxed">', '<p className="text-[15px] font-medium text-gray-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">'],
  ['className="rounded-[16px] border border-gray-200/80 bg-white p-3.5 shadow-sm hover:shadow-md transition-shadow"', 'className="rounded-[16px] border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-sm hover:shadow-md transition-shadow"']
]);

// ============================================================================
// 3. PATCH ONBOARDING
// ============================================================================
patchFile('../src/app/onboarding/page.tsx', [
  // Container
  ['className="relative min-h-screen w-full flex flex-col bg-[#F8F8F8] text-[#1A1A1A] font-sans overflow-x-hidden selection:bg-orange-100 selection:text-orange-700"', 'className="relative min-h-screen w-full flex flex-col bg-[#F8F8F8] dark:bg-zinc-950 text-[#1A1A1A] dark:text-zinc-100 font-sans overflow-x-hidden selection:bg-orange-100 selection:text-orange-700"'],
  // Background 
  ['style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: \'24px 24px\' }}', 'className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" \n          style={{ backgroundImage: `radial-gradient(var(--foreground, #000) 1px, transparent 1px)`, backgroundSize: \'24px 24px\' }}`'],
  ['className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F5F5] to-[#EBEBEB] opacity-40"', 'className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F5F5] dark:via-zinc-900 to-[#EBEBEB] dark:to-black opacity-40"'],
  // Nav
  ['className="sticky top-0 z-50 h-[64px] md:h-[72px] w-full flex items-center justify-between px-4 md:px-12 bg-white/70 backdrop-blur-lg border-b border-gray-200/50 transition-all"', 'className="sticky top-0 z-50 h-[64px] md:h-[72px] w-full flex items-center justify-between px-4 md:px-12 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border-b border-gray-200/50 dark:border-zinc-800/50 transition-all"'],
  ['<span className="font-semibold text-lg md:text-xl tracking-tight text-black">AgentDesk</span>', '<span className="font-semibold text-lg md:text-xl tracking-tight text-black dark:text-zinc-100">AgentDesk</span>'],
  ['className="flex items-center gap-4 md:gap-6 text-[13px] md:text-[14px] font-medium text-gray-500"', 'className="flex items-center gap-4 md:gap-6 text-[13px] md:text-[14px] font-medium text-gray-500 dark:text-zinc-400"'],
  ['className="hover:text-black flex items-center gap-1 transition-colors duration-200"', 'className="hover:text-black dark:hover:text-zinc-100 flex items-center gap-1 transition-colors duration-200"'],
  // Step 1
  ['className="text-[34px] sm:text-[44px] md:text-[52px] font-semibold leading-[1.1] tracking-[-0.04em] text-black mb-3 md:mb-4"', 'className="text-[34px] sm:text-[44px] md:text-[52px] font-semibold leading-[1.1] tracking-[-0.04em] text-black dark:text-zinc-100 mb-3 md:mb-4"'],
  ['<p className="text-[15px] sm:text-[17px] font-medium text-gray-500 leading-relaxed max-w-[480px]">', '<p className="text-[15px] sm:text-[17px] font-medium text-gray-500 dark:text-zinc-400 leading-relaxed max-w-[480px]">'],
  ['<span className="block text-gray-400 font-normal text-[14px] sm:text-[15px] mt-1">', '<span className="block text-gray-400 dark:text-zinc-500 font-normal text-[14px] sm:text-[15px] mt-1">'],
  ['className="w-full max-w-[460px] bg-white/82 backdrop-blur-xl border border-gray-200/70 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04),0_20px_60px_-15px_rgba(0,0,0,0.02)] flex flex-col gap-5 sm:gap-6 relative"', 'className="w-full max-w-[460px] bg-white/82 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200/70 dark:border-zinc-800/70 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04),0_20px_60px_-15px_rgba(0,0,0,0.02)] flex flex-col gap-5 sm:gap-6 relative"'],
  ['<div className="text-[12px] sm:text-[13px] text-gray-500">', '<div className="text-[12px] sm:text-[13px] text-gray-500 dark:text-zinc-400">'],
  ['className="w-full h-[52px] sm:h-[56px] pl-11 sm:pl-12 pr-4 rounded-[14px] bg-[#FCFCFC] border border-gray-200 outline-none text-[15px] text-gray-900 placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-orange-300 focus:ring-[3px] ring-orange-500/10"', 'className="w-full h-[52px] sm:h-[56px] pl-11 sm:pl-12 pr-4 rounded-[14px] bg-[#FCFCFC] dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 outline-none text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-orange-300 focus:ring-[3px] ring-orange-500/10"'],
  ['className="group relative w-full h-[50px] sm:h-[54px] bg-black text-white rounded-[16px] font-semibold text-[15px] flex items-center justify-center overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_25px_-6px_rgba(249,115,22,0.25)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"', 'className="group relative w-full h-[50px] sm:h-[54px] bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[16px] font-semibold text-[15px] flex items-center justify-center overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_25px_-6px_rgba(249,115,22,0.25)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"'],
  // Step 2
  ['className="bg-white/82 backdrop-blur-xl border border-gray-200/70 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"', 'className="bg-white/82 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200/70 dark:border-zinc-800/70 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"'],
  ['className="flex items-center gap-3 sm:gap-4 pb-5 sm:pb-6 mb-5 sm:mb-6 border-b border-gray-100"', 'className="flex items-center gap-3 sm:gap-4 pb-5 sm:pb-6 mb-5 sm:mb-6 border-b border-gray-100 dark:border-zinc-800"'],
  ['className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0"', 'className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0"'],
  ['<h2 className="text-[17px] sm:text-[19px] font-semibold text-black tracking-tight">Training your AI</h2>', '<h2 className="text-[17px] sm:text-[19px] font-semibold text-black dark:text-zinc-100 tracking-tight">Training your AI</h2>'],
  ['<p className="text-[12px] sm:text-[13px] text-gray-500 font-medium truncate max-w-[200px] sm:max-w-none">', '<p className="text-[12px] sm:text-[13px] text-gray-500 dark:text-zinc-400 font-medium truncate max-w-[200px] sm:max-w-none">'],
  ['className={`text-[13px] sm:text-[14px] font-medium transition-colors duration-300 ${item.status === \'done\' ? \'text-gray-800\' : item.status === \'active\' ? \'text-black\' : \'text-gray-400\'}`}', 'className={`text-[13px] sm:text-[14px] font-medium transition-colors duration-300 ${item.status === \'done\' ? \'text-gray-800 dark:text-zinc-200\' : item.status === \'active\' ? \'text-black dark:text-zinc-100\' : \'text-gray-400 dark:text-zinc-500\'}`}`'],
  ['className="mt-6 sm:mt-8 pt-4 border-t border-gray-50 overflow-hidden h-8 flex items-center"', 'className="mt-6 sm:mt-8 pt-4 border-t border-gray-50 dark:border-zinc-800 overflow-hidden h-8 flex items-center"'],
  ['className="text-[11px] sm:text-[12px] font-mono text-gray-600 flex items-center gap-2"', 'className="text-[11px] sm:text-[12px] font-mono text-gray-600 dark:text-zinc-400 flex items-center gap-2"'],
  ['className="w-full h-[48px] sm:h-[52px] bg-black text-white rounded-[16px] font-semibold text-[15px] flex items-center justify-center gap-1 hover:-translate-y-[2px] hover:shadow-md transition-all duration-200"', 'className="w-full h-[48px] sm:h-[52px] bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[16px] font-semibold text-[15px] flex items-center justify-center gap-1 hover:-translate-y-[2px] hover:shadow-md transition-all duration-200"'],
  // Step 3
  ['className="bg-white border border-gray-200/70 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative"', 'className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800/70 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative"'],
  ['<h2 className="text-[20px] sm:text-[22px] font-semibold text-black leading-tight">Your AI Agent is ready to preview!</h2>', '<h2 className="text-[20px] sm:text-[22px] font-semibold text-black dark:text-zinc-100 leading-tight">Your AI Agent is ready to preview!</h2>'],
  ['<p className="text-[13px] sm:text-[14px] text-gray-500 mt-1">Click Next to continue</p>', '<p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-zinc-400 mt-1">Click Next to continue</p>'],
  ['className="flex items-center gap-2 text-[13px] sm:text-[14px] text-gray-500 font-medium mb-5 sm:mb-6"', 'className="flex items-center gap-2 text-[13px] sm:text-[14px] text-gray-500 dark:text-zinc-400 font-medium mb-5 sm:mb-6"'],
  ['className="border border-gray-100 rounded-[16px] overflow-hidden mb-6 sm:mb-8 bg-white shadow-sm"', 'className="border border-gray-100 dark:border-zinc-800 rounded-[16px] overflow-hidden mb-6 sm:mb-8 bg-white dark:bg-zinc-950 shadow-sm"'],
  ['className="p-3 sm:p-4 text-[12px] sm:text-[13px] text-gray-800 leading-relaxed bg-[#FCFCFD]"', 'className="p-3 sm:p-4 text-[12px] sm:text-[13px] text-gray-800 dark:text-zinc-300 leading-relaxed bg-[#FCFCFD] dark:bg-zinc-950"'],
  ['className="flex items-start sm:items-center gap-3 text-[13px] sm:text-[14px] text-gray-800 font-medium"', 'className="flex items-start sm:items-center gap-3 text-[13px] sm:text-[14px] text-gray-800 dark:text-zinc-200 font-medium"'],
  ['className="h-[40px] sm:h-[42px] px-6 sm:px-8 bg-black text-white font-semibold text-[13px] sm:text-[14px] rounded-full shadow-sm hover:opacity-90 transition-all flex items-center justify-center"', 'className="h-[40px] sm:h-[42px] px-6 sm:px-8 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-[13px] sm:text-[14px] rounded-full shadow-sm hover:opacity-90 transition-all flex items-center justify-center"'],
  // Step 4
  ['<h1 className="text-[26px] sm:text-[32px] font-semibold text-black tracking-tight leading-tight px-4">Where will you use it?</h1>', '<h1 className="text-[26px] sm:text-[32px] font-semibold text-black dark:text-zinc-100 tracking-tight leading-tight px-4">Where will you use it?</h1>'],
  ['className="text-gray-500 text-[14px] sm:text-[15px] font-medium mt-2 px-4"', 'className="text-gray-500 dark:text-zinc-400 text-[14px] sm:text-[15px] font-medium mt-2 px-4"'],
  [': \'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50\'', ': \'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-850\''],
  ['className={`text-[12px] sm:text-[13px] font-semibold tracking-tight leading-tight ${isSel ? \'text-white\' : \'text-gray-600\'}`}', 'className={`text-[12px] sm:text-[13px] font-semibold tracking-tight leading-tight ${isSel ? \'text-white\' : \'text-gray-600 dark:text-zinc-300\'}`}`'],
  ['className="w-full sm:w-auto text-[13px] sm:text-[14px] font-semibold text-gray-400 hover:text-black px-6 py-3 order-2 sm:order-1 transition-colors"', 'className="w-full sm:w-auto text-[13px] sm:text-[14px] font-semibold text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-zinc-200 px-6 py-3 order-2 sm:order-1 transition-colors"'],
  ['className="w-[80%] sm:w-auto h-[48px] sm:h-[54px] px-8 sm:px-12 bg-black text-white font-semibold text-[14px] sm:text-[15px] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:-translate-y-[1px] transition-all flex items-center justify-center gap-1 order-1 sm:order-2"', 'className="w-[80%] sm:w-auto h-[48px] sm:h-[54px] px-8 sm:px-12 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-[14px] sm:text-[15px] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:-translate-y-[1px] transition-all flex items-center justify-center gap-1 order-1 sm:order-2"'],
  ['? \'w-[14px] sm:w-[18px] bg-black\' \n                       : \'w-[5px] sm:w-[6px] bg-gray-300\'', '? \'w-[14px] sm:w-[18px] bg-black dark:bg-zinc-100\' \n                       : \'w-[5px] sm:w-[6px] bg-gray-300 dark:bg-zinc-700\'']
]);
