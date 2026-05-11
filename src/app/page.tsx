import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Zap, Shield, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AgentDesk</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 border-none">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            AgentDesk 1.0 is now live
          </div>
          
          <h1 className="mx-auto max-w-4xl text-5xl font-medium tracking-tight text-white sm:text-7xl">
            AI Customer Support that <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">actually works.</span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-zinc-400">
            Train custom AI agents on your data in minutes. Deploy a widget to your site. Handle thousands of support tickets automatically.
          </p>
          
          <div className="mt-10 flex justify-center gap-x-6">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-base rounded-full bg-primary hover:bg-primary/90 text-white border-none shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)]">
                Start for free
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Hero Image Mockup */}
          <div className="mt-16 sm:mt-24 mx-auto max-w-5xl rounded-xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="rounded-lg bg-black border border-white/10 overflow-hidden shadow-2xl aspect-[16/9] flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              {/* Abstract Representation of Dashboard */}
              <div className="w-full h-full p-8 flex gap-6 opacity-30">
                <div className="w-64 h-full rounded-md border border-white/10 bg-white/5" />
                <div className="flex-1 flex flex-col gap-6">
                  <div className="h-24 w-full rounded-md border border-white/10 bg-white/5" />
                  <div className="flex-1 rounded-md border border-white/10 bg-white/5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="container mx-auto mt-32 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lightning Fast Setup</h3>
              <p className="text-zinc-400">Upload your PDFs or enter your website URL. Our RAG pipeline instantly learns your documentation.</p>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Seamless Widget</h3>
              <p className="text-zinc-400">Drop a single line of JavaScript into your website to embed your custom trained AI agent instantly.</p>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
              <p className="text-zinc-400">Built-in rate limiting, domain verification, and atomic credit locking to prevent abuse.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
