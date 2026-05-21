import Link from 'next/link';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'giant';
  className?: string;
}

const sizes = {
  sm: { text: 'text-[13px] sm:text-[14px]' },
  md: { text: 'text-[16px] sm:text-[18px]' },
  lg: { text: 'text-[22px] sm:text-[24px]' },
  xl: { text: 'text-[28px] sm:text-[32px]' },
  giant: { text: 'text-[40px] sm:text-[48px]' },
};

export function KeliAiLogo({ href = '/', size = 'md', className = '' }: LogoProps) {
  const s = sizes[size];
  
  const inner = (
    <span className={`inline-flex items-center group ${className}`}>
      <span className={`font-sans font-black uppercase tracking-[0.22em] ${s.text} bg-gradient-to-r from-zinc-950 via-zinc-850 to-zinc-700 dark:from-white dark:via-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent transition-all duration-300 select-none flex items-center`}>
        Keli AI<span className="text-[#FF6B35] font-black tracking-normal ml-0.5 animate-pulse">.</span>
      </span>
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
export default KeliAiLogo;
