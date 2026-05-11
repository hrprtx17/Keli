'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  Ticket, 
  BookOpen, 
  Settings, 
  CreditCard,
  LogOut
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Billing', href: '/billing', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card px-4 py-6">
      <div className="mb-8 flex items-center space-x-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
          A
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-foreground">AgentDesk</span>
          <span className="text-xs text-muted-foreground">Workspace</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="mb-4 rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">Free Plan</p>
          <div className="mt-2 h-2 w-full rounded-full bg-border">
            <div className="h-full rounded-full bg-primary" style={{ width: '45%' }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">450 / 1000 messages used</p>
        </div>
        
        <button 
          onClick={() => signOut()}
          className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
