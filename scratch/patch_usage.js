const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/usage/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = [
  // Color palette
  ["const COLORS = ['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#fbbf24'];", "const COLORS = ['#f97316', '#f59e0b', '#fbbf24', '#fca5a5', '#e4e4e7'];"],
  
  // Replace hydration mismatch logic
  [`  // Get real timestamp labels for filtering box
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 30);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateRangeStr = \`\${monthNames[monthAgo.getMonth()]} \${monthAgo.getDate().toString().padStart(2, '0')} - \${monthNames[today.getMonth()]} \${today.getDate().toString().padStart(2, '0')}, \${today.getFullYear()}\`;`,
  
  `  // Handle safe hydration date formatting
  const [dateRangeStr, setDateRangeStr] = useState('Loading range...');
  useEffect(() => {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    setDateRangeStr(\`\${monthNames[monthAgo.getMonth()]} \${monthAgo.getDate().toString().padStart(2, '0')} - \${monthNames[today.getMonth()]} \${today.getDate().toString().padStart(2, '0')}, \${today.getFullYear()}\`);
  }, []);`],
  
  // Fix select boxes classes
  ['bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-50', 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all px-3 py-1.5'],
  ['flex items-center gap-2 px-3 py-1.5 bg-white', 'flex items-center gap-2 bg-white'],
  
  // Charts Blue to Orange
  ['className="text-blue-500"', 'className="text-orange-500"'],
  ['stroke="#f4f4f5"', 'stroke="currentColor" className="text-zinc-100 dark:text-zinc-900"'],
  ['fill="#2563eb"', 'fill="#f97316"'],
  ["<Tooltip cursor={{fill: '#f8fafc'}} />", "<Tooltip cursor={{fill: 'currentColor', opacity: 0.03}} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px' }} />"]
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
      console.warn(`WARNING: Target not found in usage page: ${cleanTarget.substring(0, 50)}...`);
    }
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully updated Usage page analytics and suppressed hydration risks!");
