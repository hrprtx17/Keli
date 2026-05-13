const fs = require('fs');
const path = require('path');

const files = [
  '../src/app/login/page.tsx',
  '../src/app/register/page.tsx',
  '../src/app/onboarding/page.tsx'
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File missing: ${relPath}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Replace the duplicated and incorrect pattern
  // Target:
  /*
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" 
          style={{ backgroundImage: `radial-gradient(var(--foreground, #000) 1px, transparent 1px)`, backgroundSize: '24px 24px' }}` 
        />
  */
  
  // Match the corrupted fragment using regex and replace with single correct tag
  const corruptedRegex = /<div\s+className="absolute inset-0 opacity-\[0\.03\]"\s+className="absolute inset-0 opacity-\[0\.03\] dark:opacity-\[0\.06\]"\s+style=\{\{\s*backgroundImage:\s*`radial-gradient\(var\(--foreground,\s*#000\)\s*1px,\s*transparent\s*1px\)`,\s*backgroundSize:\s*'24px\s*24px'\s*\}\}`\s*\/>/g;
  
  if (corruptedRegex.test(content)) {
     content = content.replace(corruptedRegex, `<div \n          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" \n          style={{ backgroundImage: \`radial-gradient(var(--foreground, #000) 1px, transparent 1px)\`, backgroundSize: '24px 24px' }} \n        />`);
     fs.writeFileSync(fullPath, content, 'utf-8');
     console.log(`Fixed regex corruption in ${relPath}`);
     continue;
  }
  
  // Try a more lenient string split & join if regex fails
  const badBlock = `          className="absolute inset-0 opacity-[0.03]" \n          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" \n          style={{ backgroundImage: \`radial-gradient(var(--foreground, #000) 1px, transparent 1px)\`, backgroundSize: '24px 24px' }}\``;
  
  const goodBlock = `          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" \n          style={{ backgroundImage: \`radial-gradient(var(--foreground, #000) 1px, transparent 1px)\`, backgroundSize: '24px 24px' }}`;
  
  if (content.includes(badBlock)) {
    content = content.split(badBlock).join(goodBlock);
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Fixed block string replacement in ${relPath}`);
  } else {
    // Test if it just has double class names or trailing backtick
    console.log(`Checking fallback string cleanup for ${relPath}`);
    const normContent = content.replace(/\r\n/g, '\n');
    const fallbackSearch = `          className="absolute inset-0 opacity-[0.03]" \n          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" \n          style={{ backgroundImage: \`radial-gradient(var(--foreground, #000) 1px, transparent 1px)\`, backgroundSize: '24px 24px' }}\``;
    if (normContent.includes(fallbackSearch)) {
      const fixedContent = normContent.split(fallbackSearch).join(goodBlock);
      fs.writeFileSync(fullPath, fixedContent, 'utf-8');
      console.log(`Fixed with fallback normalization in ${relPath}`);
    } else {
      console.log(`No match found for cleanup in ${relPath}`);
    }
  }
}

// Handle onboarding page specific double-up if it was slightly different (opacity-0.04 instead of 0.03)
const onboardPath = path.join(__dirname, '../src/app/onboarding/page.tsx');
if (fs.existsSync(onboardPath)) {
  let onboardContent = fs.readFileSync(onboardPath, 'utf-8').replace(/\r\n/g, '\n');
  
  const badOnboard = `          className="absolute inset-0 opacity-[0.04]" \n          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" \n          style={{ backgroundImage: \`radial-gradient(var(--foreground, #000) 1px, transparent 1px)\`, backgroundSize: '24px 24px' }}\``;
  
  const goodOnboard = `          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" \n          style={{ backgroundImage: \`radial-gradient(var(--foreground, #000) 1px, transparent 1px)\`, backgroundSize: '24px 24px' }}`;
  
  if (onboardContent.includes(badOnboard)) {
     onboardContent = onboardContent.split(badOnboard).join(goodOnboard);
     fs.writeFileSync(onboardPath, onboardContent, 'utf-8');
     console.log(`Successfully cleaned up onboarding specifically!`);
  }
}
