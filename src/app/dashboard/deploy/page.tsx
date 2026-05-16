'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Check, Copy, ExternalLink, Globe, Layout, MessageSquare, Terminal, Monitor, Smartphone, Loader2 } from 'lucide-react'

export default function DeployPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [testUrl, setTestUrl] = useState('')
  const [settings, setSettings] = useState({
    primaryColor: '#FF6B35',
    welcomeMessage: '',
    showBranding: true
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAgent()
    }
  }, [status])

  const fetchAgent = async () => {
    try {
      const res = await fetch('/api/agents')
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
    } catch (err) {
      console.error('Failed to fetch agent', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDeploy = async (checked: boolean) => {
    if (!agent) return
    try {
      const res = await fetch(`/api/agents/${agent._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: checked })
      })
      if (res.ok) {
        setAgent({ ...agent, isActive: checked })
        toast({
          title: checked ? "Agent Deployed" : "Agent Taken Offline",
          description: checked ? "Your widget is now live." : "Your widget is now offline.",
        })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" })
    }
  }

  const handleSaveSettings = async () => {
    if (!agent) return
    try {
      const res = await fetch(`/api/agents/${agent._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetConfig: {
            ...agent.widgetConfig,
            primaryColor: settings.primaryColor,
            welcomeMessage: settings.welcomeMessage,
            showBranding: settings.showBranding
          }
        })
      })
      if (res.ok) {
        toast({ title: "Settings Saved", description: "Widget updated." })
        fetchAgent()
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" })
    }
  }

  const embedCode = `<script 
  src="https://agentdeskk.netlify.app/agentdesk.js" 
  data-agent-id="${agent?._id || '[AGENT_ID]'}">
</script>`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast({ title: "Copied!", description: "Embed code copied." })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTest = () => {
    if (!testUrl) return
    const url = testUrl.startsWith('http') ? testUrl : `https://${testUrl}`
    window.open(url, '_blank')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin" />
        <p className="text-gray-500 font-medium">Loading deployment settings...</p>
      </div>
    )
  }

  if (!agent) return <div className="p-8 text-center text-gray-500">No agent found.</div>

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
        <div className="lg:col-span-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Deploy Your Agent</h1>
            <p className="text-gray-500 mt-2 text-lg">Add your AI assistant to any website in under 2 minutes</p>
          </div>

          <Card className="border-gray-200">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-800 text-lg">{agent.name}</span>
                {agent.isActive ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Live
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-none px-3 py-1 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span> Not deployed
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <Switch checked={agent.isActive} onCheckedChange={handleToggleDeploy} className="data-[state=checked]:bg-[#FF6B35]" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="html" className="w-full">
            <TabsList className="bg-gray-100 p-1 mb-4 h-12">
              <TabsTrigger value="html" className="data-[state=active]:bg-white data-[state=active]:text-[#FF6B35] px-6 h-10">HTML</TabsTrigger>
              <TabsTrigger value="wordpress" className="data-[state=active]:bg-white data-[state=active]:text-[#FF6B35] px-6 h-10">WordPress</TabsTrigger>
              <TabsTrigger value="webflow" className="data-[state=active]:bg-white data-[state=active]:text-[#FF6B35] px-6 h-10">Webflow</TabsTrigger>
              <TabsTrigger value="framer" className="data-[state=active]:bg-white data-[state=active]:text-[#FF6B35] px-6 h-10">Framer</TabsTrigger>
            </TabsList>

            <DeployTabContent 
              value="html"
              title="Paste this snippet before the </body> tag in your HTML"
              steps={["Copy the code above", "Open your website's HTML file", "Paste before </body>", "Save and open your website"]}
              code={embedCode} onCopy={copyToClipboard} copied={copied}
            />

            <DeployTabContent 
              value="wordpress"
              title="Add this to your WordPress site using the WPCode plugin (free)"
              steps={["Install WPCode plugin", "Go to Code Snippets → Add Snippet", "Paste code and set location to Footer", "Activate snippet"]}
              code={embedCode} onCopy={copyToClipboard} copied={copied}
              footerLink={{ text: "→ Download WPCode Plugin (free)", url: "https://wordpress.org/plugins/insert-headers-and-footers/" }}
            />

            <DeployTabContent 
              value="webflow"
              title="Add this in Webflow's custom code settings"
              steps={["Open Webflow dashboard", "Site Settings → Custom Code", "Paste in Footer Code", "Publish site"]}
              code={embedCode} onCopy={copyToClipboard} copied={copied}
              tip="💡 Tip: You can also add this to a specific page only via Page Settings → Custom Code"
            />

            <DeployTabContent 
              value="framer"
              title="Add this in Framer's site-wide custom code"
              steps={["Open Framer project", "Site Settings → General", "Paste in End of body tag", "Publish"]}
              code={embedCode} onCopy={copyToClipboard} copied={copied}
            />
          </Tabs>

          <Card className="border-orange-100 bg-orange-50/30">
            <CardHeader><CardTitle className="text-lg">Test Your Widget</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input placeholder="Enter your website URL (e.g. example.com)" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} className="bg-white" />
                <Button onClick={handleTest} className="bg-[#FF6B35] hover:bg-[#e85a2a] text-white px-8">Test Widget</Button>
              </div>
              <p className="text-sm text-gray-500">After pasting the code, enter your site URL to verify the widget appears</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-semibold text-gray-700">Preview</h3>
              <div className="flex gap-2"><Monitor className="w-4 h-4 text-[#FF6B35]" /><Smartphone className="w-4 h-4 text-gray-400" /></div>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="h-10 bg-gray-50 border-bottom border-gray-200 flex items-center px-4 justify-between">
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><div className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
                <div className="bg-white border border-gray-200 px-3 py-0.5 rounded text-[10px] text-gray-400 w-48 text-center">yourwebsite.com</div>
                <div className="w-10" />
              </div>
              <div className="h-[300px] bg-gray-50 p-6 relative">
                <div className="space-y-3"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-20 bg-gray-200 rounded w-full mt-6" /></div>
                <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: settings.primaryColor }}><MessageSquare className="text-white w-6 h-6" /></div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Widget Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Widget Color</label>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: settings.primaryColor }} />
                  <Input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="flex-grow h-10 p-1 cursor-pointer" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Welcome Message</label>
                <Input placeholder="Hi! How can I help you today?" value={settings.welcomeMessage} onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Show "Powered by AgentDesk"</label>
                <Switch checked={settings.showBranding} onCheckedChange={(checked) => setSettings({ ...settings, showBranding: checked })} className="data-[state=checked]:bg-[#FF6B35]" />
              </div>
              <Button onClick={handleSaveSettings} className="w-full bg-[#FF6B35] hover:bg-[#e85a2a] text-white">Save Settings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DeployTabContent({ value, title, steps, code, onCopy, copied, footerLink, tip }: any) {
  return (
    <TabsContent value={value} className="space-y-6">
      <div className="space-y-4">
        <p className="text-gray-700 font-medium">{title}</p>
        <div className="relative">
          <pre className="bg-[#1a1a1a] text-gray-300 p-5 rounded-xl font-mono text-sm overflow-x-auto border border-gray-800">{code}</pre>
          <Button size="sm" onClick={onCopy} className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy Code"}
          </Button>
        </div>
        <div className="space-y-4 pt-2">
          {steps.map((step: string, i: number) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B35] flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</div>
              <p className="text-gray-600 text-sm">{step}</p>
            </div>
          ))}
        </div>
        {footerLink && <a href={footerLink.url} target="_blank" className="inline-block text-sm text-[#FF6B35] hover:underline mt-2 font-medium">{footerLink.text}</a>}
        {tip && <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 mt-4">{tip}</div>}
      </div>
    </TabsContent>
  )
}
