'use client';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Scale } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-xl bg-primary/10 text-primary"><Shield className="h-6 w-6"/></div>
             <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground text-sm">Last Updated: May 11, 2026</p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none border-t pt-8 space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Data Transmission</h2>
            <p>We treat your dataset with explicit caution. Data ingested for training AI agents operates only within your secure vault partitions and functions purely via secure, ephemeral processing APIs. We never sell your client chat logs.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Encryption Standards</h2>
            <p>All client conversations transmitted through the custom widget use robust end-to-end transport layer encryption to safeguard transmission between consumer browsers and underlying inference models.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Cookies and Telemetry</h2>
            <p>AgentDesk employs essential tracking to maintain authenticated workspace states and combat fraudulent bot deployment behaviors, minimizing non-operational data extraction.</p>
          </section>
          
          <div className="bg-muted/30 p-6 rounded-xl border text-sm">
            <p className="font-medium text-foreground mb-1">Subject Rights</p>
            <p>Users are entitled to request data extraction maps or permanent workspace expungement by engaging platform support at any point.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
