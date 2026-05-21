'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, Copy, ExternalLink, Globe, Layout, MessageSquare, 
  Terminal, Monitor, Loader2, Lock, Save, RefreshCw 
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default function DeployPage() {
  const { data: session, status } = useSession()
  const [agent, setAgent] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [testUrl, setTestUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isStatusSaving, setIsStatusSaving] = useState(false)
  const [siteUrl, setSiteUrl] = useState('http://localhost:3000')
  const [settings, setSettings] = useState({
    primaryColor: '#FF6B35',
    welcomeMessage: '',
    showBranding: true
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteUrl(window.location.origin)
    }
  }, [])

  const fetchWorkspace = async () => {
    try {
      const res = await fetch('/api/workspace')
      if (res.ok) {
        const data = await res.json()
        setWorkspace(data)
      }
    } catch (err) {
      console.error('Failed to fetch workspace information', err)
    }
  }

  const fetchAgent = async () => {
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) {
          const currentAgent = data[0]
          setAgent(currentAgent)
          setSettings({
            primaryColor: currentAgent.widgetConfig?.primaryColor || '#FF6B35',
            welcomeMessage: currentAgent.widgetConfig?.welcomeMessage || '',
            showBranding: currentAgent.widgetConfig?.showBranding ?? true
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch agent', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAgent()
      fetchWorkspace()
    }
  }, [status])

  const handleToggleDeploy = async (checked: boolean) => {
    if (!agent) return
    setIsStatusSaving(true)
    try {
      const res = await fetch(`/api/agents/${agent._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isActive: checked,
          isDeployed: checked 
        })
      })
      if (res.ok) {
        setAgent({ ...agent, isActive: checked })
        toast.success(checked ? "Widget Live" : "Widget Taken Offline", {
          description: checked 
            ? "Your AI assistant is now actively responding." 
            : "Your AI assistant has been temporarily paused.",
        })
      }
    } catch (err) {
      toast.error("Failed to Update Status", { description: "Failed to sync deployment parameters." })
    } finally {
      setIsStatusSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!agent) return
    setIsSaving(true)
    
    const showBrandingFinal = workspace?.plan === 'premium' ? settings.showBranding : true

    try {
      const res = await fetch(`/api/agents/${agent._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetConfig: {
            ...agent.widgetConfig,
            primaryColor: settings.primaryColor,
            welcomeMessage: settings.welcomeMessage,
            showBranding: showBrandingFinal
          }
        })
      })
      if (res.ok) {
        toast.success("Settings Saved", { description: "Widget visualization parameters synchronized." })
        fetchAgent()
      } else {
        throw new Error('Save failed')
      }
    } catch (err) {
      toast.error("Failed to Sync Settings", { description: "Connection interrupted. Try again." })
    } finally {
      setIsSaving(false)
    }
  }

  const embedCode = `<!-- Keli AI Widget -->\n<script\n  src="${siteUrl}/widget.js"\n  data-agent-id="${agent?._id || '[REAL_AGENT_ID]'}">\n</script>`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast.success("Code Snippet Copied", { description: "Copied embedding instructions to clipboard." })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTest = () => {
    if (!testUrl) return
    const url = testUrl.startsWith('http') ? testUrl : `https://${testUrl}`
    window.open(url, '_blank')
  }

  const isPremium = workspace?.plan === 'premium'

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
          <p className="text-zinc-500 text-xs font-semibold">Synchronizing deployment variables...</p>
        </div>
      ) : !agent ? (
        <div className="p-8 text-center text-zinc-500 text-xs font-semibold border border-zinc-200/50 rounded-2xl max-w-md mx-auto mt-20 bg-white">
          Failed to load agent data. Please refresh.
        </div>
      ) : (
        <div className="container mx-auto py-6 px-4 max-w-5xl animate-in fade-in duration-500 relative z-10 pb-32">
      
          {/* PAGE HEADER */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Widget Integration</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm sm:text-[15px] leading-relaxed">
              Add {agent.name} to your HTML website in just one step.
            </p>
          </div>

          {/* STATUS & TOGGLE BAR */}
          <Card className="border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-xs mb-8">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="flex flex-col">
                  <span className="font-bold text-zinc-900 dark:text-zinc-50 text-base leading-tight">{agent.name}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    Widget status control
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div>
                  {agent.isActive ? (
                    <span className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-900/50 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active & Online
                    </span>
                  ) : (
                    <span className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Offline
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl px-3 py-1.5">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Live Status</span>
                  {isStatusSaving ? (
                    <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                  ) : (
                    <Switch 
                      checked={agent.isActive} 
                      onCheckedChange={handleToggleDeploy} 
                      className="data-[state=checked]:bg-[#FF6B35]" 
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: INTEGRATION CODE (HTML ONLY) */}
            <div className="md:col-span-7 space-y-6">
              
              <Card className="border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 sm:p-6 shadow-xs">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">HTML Script Embed</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Copy and paste this script tag at the bottom of your HTML document before the closing &lt;/body&gt; tag.</p>
                  </div>

                  <div className="relative group">
                    <pre className="bg-zinc-950 text-zinc-300 p-4.5 rounded-xl font-mono text-[12.5px] overflow-x-auto border border-zinc-850 leading-relaxed">
                      <span className="text-[#8B8B8B]">&lt;!-- Keli AI Widget --&gt;</span>{'\n'}
                      <span className="text-[#EC592D]">&lt;script</span>{'\n'}
                      <span className="text-[#9CDCFE]">  src</span><span className="text-zinc-400">=</span><span className="text-[#CE9178]">&quot;{siteUrl}/widget.js&quot;</span>{'\n'}
                      <span className="text-[#9CDCFE]">  data-agent-id</span><span className="text-zinc-400">=</span><span className="text-[#CE9178]">&quot;{agent?._id || '[REAL_AGENT_ID]'}&quot;</span>{'\n'}
                      <span className="text-[#EC592D]">&gt;&lt;/script&gt;</span>
                    </pre>
                    
                    <Button 
                      size="sm" 
                      onClick={copyToClipboard} 
                      className="absolute top-3 right-3 bg-zinc-900/80 hover:bg-zinc-900 text-white border border-zinc-850 shadow-xs"
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.span key="copied" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-[11px] font-semibold text-green-400">
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </motion.span>
                        ) : (
                          <motion.span key="copy" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                            <Copy className="w-3.5 h-3.5" /> Copy Code
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </div>

                  <div className="pt-2 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Step-by-step instructions</h3>
                    
                    <div className="space-y-3.5">
                      {[
                        "Copy the HTML script snippet above.",
                        "Open the source code of your website template or HTML file.",
                        "Paste the snippet just before the closing </body> tag of your pages.",
                        "Deploy your changes live. The assistant button will appear automatically."
                      ].map((step, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-5.5 h-5.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-[#FF6B35] flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 border border-orange-100 dark:border-orange-900/30">
                            {i + 1}
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm font-medium pt-0.5 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* TEST WIDGET CARD */}
              <Card className="border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Verify your integration</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Enter your website URL after installing to test that it is loading correctly</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                      placeholder="https://yourwebsite.com" 
                      value={testUrl} 
                      onChange={(e) => setTestUrl(e.target.value)} 
                      className="bg-white dark:bg-zinc-950 text-xs border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-[#FF6B35]" 
                    />
                    <Button 
                      onClick={handleTest} 
                      className="bg-[#FF6B35] hover:bg-orange-600 text-white font-bold text-xs px-6 shadow-sm flex items-center gap-1.5 shrink-0"
                    >
                      Verify Site <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="pt-1">
                    <a 
                      href={`${siteUrl}/widget-test.html`} 
                      target="_blank" 
                      className="text-xs text-[#FF6B35] hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      Open test sandbox website →
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: LIVE CUSTOMIZER & SIMULATION */}
            <div className="md:col-span-5 space-y-6">
              
              {/* MINI SIMULATED BROWSER */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Preview on your site</span>
                <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-zinc-950">
                  <div className="h-9 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444] opacity-80" />
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B] opacity-80" />
                      <div className="w-2 h-2 rounded-full bg-[#22C55E] opacity-80" />
                    </div>
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded text-[9.5px] text-zinc-400 w-36 text-center select-none font-medium truncate">
                      yourwebsite.com
                    </div>
                    <div className="w-6" />
                  </div>
                  <div className="h-[180px] bg-zinc-50/50 dark:bg-zinc-950/20 p-5 relative overflow-hidden">
                    <div className="space-y-3">
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-[50%] animate-pulse" />
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-[70%]" />
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-[60%]" />
                    </div>

                    {/* Floating Launcher Button */}
                    <div 
                      className="absolute bottom-4 right-4 w-10.5 h-10.5 rounded-full flex items-center justify-center shadow-md cursor-default transition-all duration-300"
                      style={{ 
                        backgroundColor: settings.primaryColor,
                        boxShadow: `0 3px 12px ${settings.primaryColor}4D`
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* STYLING CONFIGURATOR */}
              <Card className="border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
                <CardContent className="p-5 space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Widget Appearance</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Customize color and greeting</p>
                  </div>

                  {/* Widget Color */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Accent Color</label>
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5">
                      <div 
                        className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-xs" 
                        style={{ backgroundColor: settings.primaryColor }} 
                      />
                      <Input 
                        type="color" 
                        value={settings.primaryColor} 
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} 
                        className="flex-grow h-8 p-0.5 cursor-pointer bg-transparent border-none" 
                      />
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase px-1.5">{settings.primaryColor}</span>
                    </div>
                  </div>

                  {/* Welcome Message */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Welcome Message</label>
                    <Input 
                      placeholder="Hi! How can I help you today?" 
                      value={settings.welcomeMessage} 
                      onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })} 
                      className="bg-white dark:bg-zinc-950 text-xs border-zinc-200 dark:border-zinc-850"
                    />
                  </div>

                  {/* Show Branding */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Show &apos;Powered by Keli AI&apos;</label>
                        {!isPremium && (
                          <span className="text-[10px] font-semibold text-orange-500 flex items-center gap-1 mt-0.5">
                            <Lock className="w-3 h-3" /> Premium Feature
                          </span>
                        )}
                      </div>
                      <Switch 
                        disabled={!isPremium}
                        checked={!isPremium ? true : settings.showBranding} 
                        onCheckedChange={(checked) => setSettings({ ...settings, showBranding: checked })} 
                        className="data-[state=checked]:bg-[#FF6B35]" 
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={isSaving}
                    className="w-full bg-[#FF6B35] hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-lg shadow-sm flex items-center justify-center gap-1.5 mt-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      )}
    </DashboardLayout>
  )
}
