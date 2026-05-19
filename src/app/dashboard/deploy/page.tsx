'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, Copy, ExternalLink, Globe, Layout, MessageSquare, 
  Terminal, Monitor, Smartphone, Loader2, Lock, Save, RefreshCw 
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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAgent()
      fetchWorkspace()
    }
  }, [status])

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
    
    // Enforce lock verification on client for additional safety
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
        <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-500 relative z-10 pb-32">
      
      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Deploy Your Widget</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-[15px] leading-relaxed">
          Add your AI chat assistant to any website in minutes
        </p>
      </div>

      {/* STATUS BAR CARD */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm mb-10 bg-white dark:bg-zinc-900/50">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-lg leading-tight truncate">{agent.name}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-1">
              Trained on: {agent.trainingUrls && agent.trainingUrls.length > 0 ? agent.trainingUrls[0] : 'No URL provided'}
            </span>
          </div>

          <div className="flex items-center gap-6 justify-between w-full sm:w-auto shrink-0">
            {/* Live Indicator Pill */}
            <div className="flex items-center">
              {agent.isActive ? (
                <span className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-900/50 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> ● Live
                </span>
              ) : (
                <span className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> ○ Not deployed
                </span>
              )}
            </div>

            {/* Active Toggle Switch */}
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 rounded-xl px-4 py-2">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Active</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN — DEPLOYMENT */}
        <div className="lg:col-span-7 space-y-8">
          
          <Tabs defaultValue="html" className="w-full">
            {/* Platform Tabs list */}
            <TabsList className="bg-zinc-100 dark:bg-zinc-900/80 p-1 mb-6 h-12 rounded-xl w-full sm:w-auto flex justify-start sm:inline-flex">
              <TabsTrigger value="html" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white px-6 h-10 rounded-lg font-bold text-xs sm:text-sm">HTML</TabsTrigger>
              <TabsTrigger value="wordpress" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white px-6 h-10 rounded-lg font-bold text-xs sm:text-sm">WordPress</TabsTrigger>
              <TabsTrigger value="webflow" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white px-6 h-10 rounded-lg font-bold text-xs sm:text-sm">Webflow</TabsTrigger>
              <TabsTrigger value="framer" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white px-6 h-10 rounded-lg font-bold text-xs sm:text-sm">Framer</TabsTrigger>
            </TabsList>

            {/* Embedded Code Snippet Displayed above steps (same for all) */}
            <div className="space-y-4 mb-6">
              <span className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Embed code snippet</span>
              <div className="relative group">
                <pre className="bg-[#0D0D0D] text-zinc-300 p-5 rounded-xl font-mono text-[13px] overflow-x-auto border border-zinc-800 leading-relaxed">
                  <span className="text-[#8B8B8B]">&lt;!-- Keli AI Widget --&gt;</span>{'\n'}
                  <span className="text-[#EC592D]">&lt;script</span>{'\n'}
                  <span className="text-[#9CDCFE]">  src</span><span className="text-zinc-400">=</span><span className="text-[#CE9178]">&quot;{siteUrl}/widget.js&quot;</span>{'\n'}
                  <span className="text-[#9CDCFE]">  data-agent-id</span><span className="text-zinc-400">=</span><span className="text-[#CE9178]">&quot;{agent?._id || '[REAL_AGENT_ID]'}&quot;</span>{'\n'}
                  <span className="text-[#EC592D]">&gt;&lt;/script&gt;</span>
                </pre>
                
                <Button 
                  size="sm" 
                  onClick={copyToClipboard} 
                  className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm transition-all duration-200"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span key="copied" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </motion.span>
                    ) : (
                      <motion.span key="copy" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 group-hover:text-white">
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </div>

            {/* HTML CONTENT */}
            <TabsContent value="html" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[16px] font-bold text-zinc-800 dark:text-zinc-200">Add to any HTML website</h3>
                
                <div className="space-y-4">
                  {[
                    "Copy the code above",
                    "Open your HTML file in any code editor",
                    "Paste just before the </body> closing tag",
                    "Save the file and refresh your website"
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-950/30 text-[#FF6B35] flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5 border border-orange-100 dark:border-orange-900/50">
                        {i + 1}
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#FFF5F0] dark:bg-orange-950/20 text-[#C2410C] dark:text-orange-400 text-xs rounded-xl border-l-4 border-[#FF6B35] font-semibold mt-6 leading-relaxed">
                  Works with any website — static HTML, Jekyll, Hugo, or any custom site
                </div>
              </div>
            </TabsContent>

            {/* WORDPRESS CONTENT */}
            <TabsContent value="wordpress" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[16px] font-bold text-zinc-800 dark:text-zinc-200">Add to WordPress</h3>

                <div className="space-y-4">
                  {[
                    "Install the free \"WPCode\" plugin",
                    "Go to Code Snippets → Add Snippet",
                    "Choose \"HTML Snippet\" type",
                    "Paste the code and set location to \"Site Wide Footer\"",
                    "Click Activate and visit your site"
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-950/30 text-[#FF6B35] flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5 border border-orange-100 dark:border-orange-900/50">
                        {i + 1}
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400 text-sm font-medium pt-0.5">
                        {i === 0 ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <span>{step}</span>
                            <a 
                              href="https://wordpress.org/plugins/insert-headers-and-footers/" 
                              target="_blank" 
                              className="text-xs bg-[#FF6B35]/10 text-[#FF6B35] px-2 py-0.5 rounded border border-[#FF6B35]/20 font-bold hover:bg-[#FF6B35]/20 transition-all"
                            >
                              → Download WPCode (free)
                            </a>
                          </div>
                        ) : step}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#FFF5F0] dark:bg-orange-950/20 text-[#C2410C] dark:text-orange-400 text-xs rounded-xl border-l-4 border-[#FF6B35] font-semibold mt-6 leading-relaxed">
                  WPCode is the safest way to add code to WordPress — no theme editing needed
                </div>
              </div>
            </TabsContent>

            {/* WEBFLOW CONTENT */}
            <TabsContent value="webflow" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[16px] font-bold text-zinc-800 dark:text-zinc-200">Add to Webflow</h3>

                <div className="space-y-4">
                  {[
                    "Open your Webflow project dashboard",
                    "Click your site name → Site Settings",
                    "Go to the Custom Code tab",
                    "Paste in the \"Footer Code\" section",
                    "Click Save and Publish your site"
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-950/30 text-[#FF6B35] flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5 border border-orange-100 dark:border-orange-900/50">
                        {i + 1}
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#FFF5F0] dark:bg-orange-950/20 text-[#C2410C] dark:text-orange-400 text-xs rounded-xl border-l-4 border-[#FF6B35] font-semibold mt-6 leading-relaxed">
                  To add only on specific pages, use Page Settings → Custom Code instead
                </div>
              </div>
            </TabsContent>

            {/* FRAMER CONTENT */}
            <TabsContent value="framer" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[16px] font-bold text-zinc-800 dark:text-zinc-200">Add to Framer</h3>

                <div className="space-y-4">
                  {[
                    "Open your Framer project",
                    "Click the site name in the top bar",
                    "Go to Site Settings → General",
                    "Find \"Custom Code\" and paste in the \"End of body\" field",
                    "Click Publish"
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-950/30 text-[#FF6B35] flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5 border border-orange-100 dark:border-orange-900/50">
                        {i + 1}
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#FFF5F0] dark:bg-orange-950/20 text-[#C2410C] dark:text-orange-400 text-xs rounded-xl border-l-4 border-[#FF6B35] font-semibold mt-6 leading-relaxed">
                  Framer re-publishes are instant — your widget goes live immediately
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* TEST WIDGET CARD */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-[#FFF5F0]/20 dark:bg-zinc-900/20">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-zinc-800 dark:text-zinc-200">Test your widget</h3>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">After embedding, enter your site URL to verify</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  placeholder="https://yoursite.com" 
                  value={testUrl} 
                  onChange={(e) => setTestUrl(e.target.value)} 
                  className="bg-white dark:bg-zinc-950 text-sm border-zinc-200 dark:border-zinc-800" 
                />
                <Button 
                  onClick={handleTest} 
                  className="bg-[#FF6B35] hover:bg-orange-600 text-white font-bold px-8 shadow-sm flex items-center gap-1.5"
                >
                  Open & Test <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="pt-2">
                <a 
                  href={`${siteUrl}/widget-test.html`} 
                  target="_blank" 
                  className="text-xs text-[#FF6B35] hover:underline font-bold inline-flex items-center gap-1.5"
                >
                  Test on our demo page →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — PREVIEW & CUSTOMIZER */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* LIVE PREVIEW CARD */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Preview</h3>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
              <div className="h-10 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                </div>
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-0.5 rounded text-[10px] text-zinc-400 w-48 text-center select-none font-medium">
                  yourwebsite.com
                </div>
                <div className="w-10" />
              </div>
              <div className="h-[260px] bg-zinc-50 dark:bg-zinc-950/20 p-6 relative overflow-hidden">
                {/* Fake Browser layout lines */}
                <div className="space-y-4">
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-[60%] animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-[80%]" />
                    <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-[70%]" />
                  </div>
                  <div className="h-20 bg-zinc-150 dark:bg-zinc-800/40 rounded w-full mt-6" />
                </div>

                {/* Pulsing launcher button in bottom-right corner */}
                <div 
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 cursor-pointer"
                  style={{ 
                    backgroundColor: settings.primaryColor,
                    boxShadow: `0 4px 16px ${settings.primaryColor}4D`
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </motion.div>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 italic font-semibold">
              This is how your widget appears to visitors
            </p>
          </div>

          {/* WIDGET CONFIGURATION SETTINGS */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Widget settings</h3>
                <p className="text-[11px] text-zinc-400 mt-1 font-semibold">Customize how your widget looks</p>
              </div>

              {/* Widget Color */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-zinc-500 tracking-wider">Widget Color</label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5">
                  <div 
                    className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0 transition-colors shadow-sm" 
                    style={{ backgroundColor: settings.primaryColor }} 
                  />
                  <Input 
                    type="color" 
                    value={settings.primaryColor} 
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} 
                    className="flex-grow h-10 p-1 cursor-pointer bg-transparent border-none w-16" 
                  />
                  <span className="text-xs font-mono font-bold text-zinc-500 uppercase px-2 select-all">{settings.primaryColor}</span>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-zinc-500 tracking-wider">Welcome Message</label>
                <Input 
                  placeholder="Hi! How can I help you today?" 
                  value={settings.welcomeMessage} 
                  onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })} 
                  className="bg-white dark:bg-zinc-950 text-sm border-zinc-200 dark:border-zinc-800"
                />
              </div>

              {/* Show Branding Switch (Premium constraint) */}
              <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Show &apos;Powered by Keli AI&apos;</label>
                    {!isPremium && (
                      <span className="text-[11px] font-semibold text-orange-500 flex items-center gap-1.5 mt-1 select-none">
                        <Lock className="w-3.5 h-3.5" /> Premium feature
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
                {!isPremium && (
                  <div>
                    <a 
                      href="/plans" 
                      className="text-xs font-bold text-[#FF6B35] hover:underline"
                    >
                      Upgrade to remove branding →
                    </a>
                  </div>
                )}
              </div>

              {/* Save Settings Trigger */}
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="w-full bg-[#FF6B35] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-md shadow-orange-500/10 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Ingressing...
                  </>
                ) : (
                  <>
                    <Save className="w-4.5 h-4.5" /> Save Settings
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
