import Link from 'next/link';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { icon: 'w-7 h-7 rounded-[9px]', dot: 'w-2.5 h-2.5', text: 'text-[15px]', gap: 'gap-2' },
  md: { icon: 'w-8 h-8 rounded-[10px]', dot: 'w-3 h-3', text: 'text-[17px]', gap: 'gap-2.5' },
  lg: { icon: 'w-10 h-10 rounded-[12px]', dot: 'w-4 h-4', text: 'text-[20px]', gap: 'gap-3' },
};

export function AgentDeskLogo({ href = '/', size = 'md', className = '' }: LogoProps) {
  const s = sizes[size];
  const inner = (
    <span className={`inline-flex items-center ${s.gap} group ${className}`}>
      <span
        className={`${s.icon} bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/30 group-hover:scale-105 transition-transform flex-shrink-0`}
      >
        <span className={`${s.dot} bg-white rounded-sm rotate-45 shadow-sm`} />
      </span>
      <span className={`font-bold ${s.text} tracking-tight text-zinc-900 dark:text-zinc-100`}>
        AgentDesk
      </span>
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
