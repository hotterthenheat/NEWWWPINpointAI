import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  HelpCircle, 
  Type, 
  Eye, 
  Palette, 
  RefreshCw, 
  Coins, 
  Share2, 
  Receipt, 
  Calculator,
  ShieldAlert,
  FolderSync,
  User,
  CreditCard,
  Lock,
  RotateCcw
} from 'lucide-react';
import { UserProfile } from './UserProfile';
import { TwoFactorFlow } from './TwoFactorFlow';
import { useContractStore, ContractStore } from '../lib/store';

interface SettingsPanelProps {
  session: any;
  onUpdateSession: () => void;
}

function KeybindRow({ bindId, label }: { bindId: keyof ContractStore['keybinds'], label: string }) {
  const keybinds = useContractStore(state => state.keybinds);
  const setKeybinds = useContractStore(state => state.setKeybinds);
  const disabledKeybinds = useContractStore(state => state.disabledKeybinds);
  const setDisabledKeybinds = useContractStore(state => state.setDisabledKeybinds);
  const [isRecording, setIsRecording] = useState(false);

  const isDisabled = disabledKeybinds[bindId];

  useEffect(() => {
    if (!isRecording) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      let key = e.key.toLowerCase();
      // Ignore bare modifiers
      if (['control', 'meta', 'shift', 'alt'].includes(key)) return;
      
      const parts = [];
      if (e.metaKey || e.ctrlKey) parts.push('cmd');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(key);
      
      setKeybinds({ [bindId]: parts.join('+') });
      setIsRecording(false);
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isRecording, bindId, setKeybinds]);

  // Translate 'cmd' to standard display based on OS
  const displayKey = (keybinds[bindId] || '').replace('cmd', typeof window !== 'undefined' && navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl');

  return (
    <div className={`flex items-center justify-between p-3 bg-zinc-900/40 border ${isDisabled ? 'border-zinc-800/50 opacity-50' : 'border-zinc-800'} rounded-lg transition-all`}>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setDisabledKeybinds({ [bindId]: !isDisabled })}
          className={`w-4 h-4 rounded flex items-center justify-center border ${isDisabled ? 'bg-transparent border-zinc-700' : 'bg-indigo-500 border-indigo-500 text-white'}`}
        >
          {!isDisabled && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 stroke-current stroke-[3]"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </button>
        <span className={`text-sm font-bold ${isDisabled ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{label}</span>
      </div>
      <button
        onClick={() => {
          if (!isDisabled) setIsRecording(true);
        }}
        disabled={isDisabled}
        className={`px-3 py-1.5 text-xs font-mono font-bold rounded flex items-center justify-center min-w-[80px] transition-all border
          ${isDisabled ? 'bg-black text-zinc-600 border-zinc-800 cursor-not-allowed' : isRecording ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-black text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'}`}
      >
        {isRecording ? 'Listening...' : displayKey.toUpperCase()}
      </button>
    </div>
  );
}

export function SettingsPanel({ session, onUpdateSession }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'keybinds' | 'referrals' | 'billing'>('profile');
  
  const [selectedFont, setSelectedFont] = useState<'STANDARD' | 'ENHANCED' | 'ENHANCED_XL'>(session?.selected_font_scale || 'STANDARD');
  const [compactMode, setCompactMode] = useState<boolean>(!!session?.compact_view_enabled);
  const [activeTheme, setActiveTheme] = useState<string>(session?.selected_theme || 'SLAYER PURE DARK');

  const globalKeybindsEnabled = useContractStore(state => state.globalKeybindsEnabled);
  const setGlobalKeybindsEnabled = useContractStore(state => state.setGlobalKeybindsEnabled);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isSimulatingInvoice, setIsSimulatingInvoice] = useState(false);
  const [invoiceLog, setInvoiceLog] = useState<any | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);

  // Link for copy
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/join/${session?.custom_referral_code || 'SLAYERX'}` 
    : `/join/${session?.custom_referral_code || 'SLAYERX'}`;

  const handleSaveSettings = async (font: 'STANDARD' | 'ENHANCED' | 'ENHANCED_XL', compact: boolean, theme: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_font_scale: font,
          compact_view_enabled: compact,
          selected_theme: theme
        })
      });

      if (res.ok) {
        onUpdateSession();
      }
    } catch (e) {
      console.error('Failed to update Settings parameters', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRunSimulatedBilling = async () => {
    setIsSimulatingInvoice(true);
    setInvoiceLog(null);
    try {
      const res = await fetch('/api/billing/sim-cron-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        setInvoiceLog(data);
        // Refresh token stats on header
        onUpdateSession();
      }
    } catch (e) {
      console.error('Invoice simulation failed', e);
    } finally {
      setIsSimulatingInvoice(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Public Profile', icon: User },
    { id: 'security', label: 'Account & Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'keybinds', label: 'Keyboard Shortcuts', icon: Type },
    { id: 'referrals', label: 'Referrals', icon: Coins },
    { id: 'billing', label: 'Billing', icon: Receipt },
  ] as const;

  return (
    <div id="slayer-settings-panel" className="w-full flex flex-col md:flex-row gap-8 text-left font-sans max-w-[800px] mx-auto">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-56 shrink-0 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-zinc-900 text-white border border-zinc-800' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-[800px]">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            <UserProfile session={session} onUpdateSession={onUpdateSession} />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-black/20 border border-zinc-900 rounded-xl p-6 space-y-5 relative shadow-lg">
              <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                <Lock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-black tracking-tight text-white">Account Vault & Security</h2>
              </div>
              <p className="text-sm text-zinc-400 mb-4">Security settings and active sessions management space.</p>
              
              <TwoFactorFlow />

              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center justify-between mt-3">
                <div>
                  <div className="text-sm font-bold text-white mb-1">Active Sessions</div>
                  <div className="text-xs text-zinc-500">Manage your active devices and logouts.</div>
                </div>
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
                  Revoke All
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Module 6: Appearance customization option box */}
            <div className="bg-black/20 border border-zinc-900 rounded-xl p-6 space-y-5 relative shadow-lg">
              <div className="absolute top-0 right-0 p-3 text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-mono">
                System Display
              </div>

              <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-black tracking-tight text-white">
                  Display Preferences
                </h2>
              </div>

              {/* Option A: Font Size Scaling (STANDARD vs ENHANCED) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Type className="w-4 h-4 text-zinc-550 shrink-0" />
                  <span>Text Size</span>
                </div>
                <p className="text-xs text-[#8e8e93] leading-relaxed">
                  Configure system terminal font scale. Enhanced scaling optimizes readability on massive high-pixel monitors.
                </p>
                
                <div className="mt-2">
                  <select
                    value={selectedFont}
                    onChange={(e) => {
                      const newVal = e.target.value as 'STANDARD' | 'ENHANCED' | 'ENHANCED_XL';
                      setSelectedFont(newVal);
                      handleSaveSettings(newVal, compactMode, activeTheme);
                    }}
                    className="w-full bg-black border border-zinc-900 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="ENHANCED">Large</option>
                    <option value="ENHANCED_XL">Extra Large</option>
                  </select>
                </div>
              </div>

              {/* Option B: Compact rows spacing density (denser row rendering overlay) */}
              <div className="pt-4 border-t border-zinc-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Eye className="w-4 h-4 text-zinc-550 shrink-0" />
                    <span>Compact View</span>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(e) => {
                        const newVal = e.target.checked;
                        setCompactMode(newVal);
                        handleSaveSettings(selectedFont, newVal, activeTheme);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-550 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-zinc-950 peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
                  </label>
                </div>
                <p className="text-xs text-[#8e8e93] leading-relaxed">
                  Toggle Compact View mode. Restructures vertical list paddings, layout metrics, and grid density for extreme information bandwidth.
                </p>
              </div>

              {/* Option C: Background Theme custom drop-down selection */}
              <div className="pt-4 border-t border-zinc-900/60 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Palette className="w-4 h-4 text-zinc-550 shrink-0" />
                  <span>Interface Theme</span>
                </div>
                <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
                  Alters background containment fields and surface panels colors.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {[
                    { id: 'dark', name: 'Dark Mode', color: '#18181b', border: '#27272a' },
                    { id: 'mocha', name: 'Mocha', color: '#2B211E', border: '#5C4A42' },
                    { id: 'purple', name: 'Deep Purple', color: '#1A0B2E', border: '#4A3076' },
                    { id: 'pink', name: 'Soft Pink', color: '#FFF0F5', border: '#F0D0DF', text: '#4A2B3D' },
                    { id: 'abyss', name: 'OLED Abyss', color: '#000000', border: '#27272A' },
                    { id: 'slate', name: 'Midnight Slate', color: '#0B1120', border: '#334155' },
                    { id: 'phantom', name: 'Phantom Radial', color: '#1C1C22', border: '#27272A' },
                    { id: 'grid', name: 'Data Grid', color: '#09090B', border: '#27272A' }
                  ].map(theme => (
                    <div
                      key={theme.id}
                      onClick={() => {
                        setActiveTheme(theme.id);
                        localStorage.setItem('slayer_theme', theme.id);
                        document.documentElement.setAttribute('data-theme', theme.id);
                        handleSaveSettings(selectedFont, compactMode, theme.id);
                      }}
                      className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        activeTheme === theme.id ? 'border-indigo-500 transform scale-105 shadow-lg' : 'border-zinc-800/60 hover:border-zinc-700'
                      }`}
                      style={{ backgroundColor: theme.color, borderColor: activeTheme === theme.id ? undefined : theme.border }}
                    >
                      <div className="h-12 rounded bg-white/5 mb-2 border border-white/10" />
                      <div 
                        className="text-[10px] font-bold text-center uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.text || '#fff' }}
                      >
                        {theme.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Informational notification */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-900 text-[11px] rounded-xl text-[#a1a1aa] leading-relaxed flex gap-3">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <b>Strict System Lock:</b> Changing themes shifts parent-level backdrops and site colors seamlessly. All key visual execution marks, heat maps, and status flags maintain their crucial hues for data legibility.
              </span>
            </div>
          </div>
        )}

        {activeTab === 'keybinds' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-black/20 border border-zinc-900 rounded-xl p-6 space-y-5 relative shadow-lg">
              <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                <Type className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-black tracking-tight text-white">Keyboard Shortcuts & Hotkeys</h2>
              </div>
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-4">
                <p className="text-sm text-zinc-400 max-w-md">
                  Customize quick-access keybinds for global menu toggles and workspace switching. These bindings work universally across macOS (Command) and Windows (Ctrl).
                </p>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                    <span className="text-xs font-bold text-zinc-300">Enable All Shortcuts</span>
                    <button
                      onClick={() => setGlobalKeybindsEnabled(!globalKeybindsEnabled)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${globalKeybindsEnabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${globalKeybindsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const defaults = {
                        home: 'shift+h',
                        skyvision: 'shift+s',
                        pinpoint: 'shift+p',
                        auditor: 'shift+a',
                        dealerflow: 'shift+d',
                        arbor: 'shift+r',
                        settings: 'shift+o',
                        prismMenu: 'cmd+k',
                      };
                      useContractStore.getState().setKeybinds(defaults);
                      useContractStore.getState().setDisabledKeybinds({});
                      setGlobalKeybindsEnabled(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-400 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-lg transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Defaults
                  </button>
                </div>
              </div>
              
              <div className={`space-y-2 transition-opacity duration-300 ${!globalKeybindsEnabled ? 'opacity-30 pointer-events-none' : ''}`}>
                {[
                  { id: 'prismMenu', label: 'Toggle Prism Command Menu', default: 'cmd+k' },
                  { id: 'home', label: 'Workspace: Home', default: 'shift+h' },
                  { id: 'skyvision', label: 'Workspace: SkyVision', default: 'shift+s' },
                  { id: 'pinpoint', label: 'Workspace: Pinpoint AI', default: 'shift+p' },
                  { id: 'auditor', label: 'Workspace: Quant Auditor', default: 'shift+a' },
                  { id: 'dealerflow', label: 'Workspace: Dealer Flow', default: 'shift+d' },
                  { id: 'arbor', label: 'Workspace: Research & Community', default: 'shift+r' },
                  { id: 'settings', label: 'Settings & Preferences', default: 'shift+o' },
                ].map(bind => (
                  <KeybindRow key={bind.id} bindId={bind.id as any} label={bind.label} />
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-zinc-950/40 border border-zinc-900 text-[11px] rounded-xl text-[#a1a1aa] leading-relaxed flex gap-3">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <b>Hotkey Note:</b> To rebind, click on a shortcut button and press your new key combination. Use Modifier keys (Shift, Ctrl, Alt, Meta) plus a character.
              </span>
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Module 5: Referrals token stats */}
            <div className="bg-black/20 border border-zinc-900 rounded-xl p-6 space-y-5 relative shadow-lg">
              <div className="absolute top-0 right-0 p-3 text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-mono">
                Module-05 Engine
              </div>

              <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-black tracking-tight text-white">
                  Referral Rewards Token Pool
                </h2>
              </div>

              {/* Referral Progress Bar (Gamification) */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-white">Tokens to Next Free Month</span>
                  <span className="text-xs font-mono text-emerald-400">{session?.referral_tokens_pool || 0} / 10</span>
                </div>
                <div className="w-full h-2.5 bg-black rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, ((session?.referral_tokens_pool || 0) / 10) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Referral Token Pool Dashboard metrics */}
              <div className="grid grid-cols-2 gap-3 bg-black/40 border border-zinc-950 rounded-xl p-4 text-center">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 font-bold block">YOUR TOKENS</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono block drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                    {session?.referral_tokens_pool || 0}
                  </span>
                  <span className="text-xs text-zinc-600 block font-mono mt-1">1 Token = 10% Off</span>
                </div>
                
                <div className="space-y-1 border-l border-zinc-900/60 pl-3">
                  <span className="text-xs text-zinc-500 font-bold block">CURRENT DISCOUNT</span>
                  <span className="text-2xl font-black text-white font-mono block">
                    {Math.min(100, (session?.referral_tokens_pool || 0) * 10)}%
                  </span>
                  <span className="text-xs text-[#8e8e93] block font-mono mt-1">Simulated Multipliers</span>
                </div>
              </div>

              {/* Your custom referral code */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm text-[#A1A1AA] font-bold block">Your Referral Code</span>
                  <div className="bg-zinc-950 border border-zinc-900 text-white rounded-lg px-3 py-2 text-sm font-bold font-mono tracking-widest text-center shadow-inner">
                    {session?.custom_referral_code || 'SLAYERX'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-[#A1A1AA] font-bold block">Your Custom Referral Link</span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 bg-zinc-950 border border-zinc-900 text-[#a1a1aa] rounded-lg px-3 py-2 text-xs font-bold font-mono md:tracking-wider flex items-center justify-between whitespace-nowrap overflow-hidden text-ellipsis shadow-inner">
                      <span className="truncate pr-2">{referralLink}</span>
                    </div>
                    <button
                      onClick={copyReferralLink}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors sm:shrink-0"
                      title="Copy full referral link to clipboard"
                    >
                      {referralCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-black/20 border border-zinc-900 rounded-xl p-6 relative shadow-lg">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-black tracking-tight text-white">Subscription & Tier</h2>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <div className="text-sm font-bold text-zinc-300">Current Plan Protocol</div>
                  <div className="text-2xl font-black uppercase text-white tracking-widest">{session?.access_tier || 'GUEST'} TIER</div>
                </div>
                <button
                  onClick={() => {
                    useContractStore.getState().setActiveTab('subscription');
                    window.scrollTo({ top: 0, behavior: 'auto' });
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                >
                  View Upgrades
                </button>
              </div>
            </div>

            {/* Invoice simulation box */}
            <div className="bg-black/20 border border-zinc-900 rounded-xl p-6 space-y-5 relative shadow-lg">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-black tracking-tight text-white">Billing & Invoices</h2>
                </div>
                <span className="text-[8px] bg-[#0c1824] px-2 py-0.5 border border-[#1e1e24] rounded text-zinc-400">Sandbox</span>
              </div>
              
              <p className="text-xs text-zinc-400">
                You currently have no active credit cards on file. This environment uses a developer sandbox integration for simulated billing runs.
              </p>

              <button
                onClick={handleRunSimulatedBilling}
                disabled={isSimulatingInvoice}
                className="w-full py-3 mt-2 bg-indigo-500/10 border border-indigo-500/30 hover:bg-[#6366f1]/20 text-indigo-400 font-black text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSimulatingInvoice ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>CALCULATING INVOICE LEDGERS...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    <span>Run Simulated Billing Invoice</span>
                  </>
                )}
              </button>

              {invoiceLog && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#050506] border border-zinc-900 rounded-lg p-3 text-left font-mono text-[10px] text-[#a1a1aa] leading-relaxed space-y-1 mt-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-1 bg-indigo-500/10 border-l border-b border-zinc-900 text-indigo-400 font-black tracking-widest text-[7px] uppercase select-none">Invoice Receipt</div>
                  <div className="text-[9px] text-zinc-650 font-black tracking-widest uppercase border-b border-zinc-900 pb-1 mb-1.5 flex justify-between">
                    <span>BILLING_RUN_RESULT // SUCCESS</span>
                    <span className="text-zinc-600 font-normal">Active tier: {invoiceLog.access_tier}</span>
                  </div>
                  <div>Plan Base Monthly Tariff: <span className="text-white font-bold font-mono">${invoiceLog.base_rate}.00</span></div>
                  <div>Invoice Tokens Redeemed: <span className="text-rose-400 text-right">-{invoiceLog.tokens_deducted} Tokens ({invoiceLog.discount_rate_pct}% Off)</span></div>
                  <div>Applied Deduction Credit: <span className="text-emerald-400 text-right">-${invoiceLog.discount_amount_usd.toFixed(2)} USD</span></div>
                  <div className="border-t border-zinc-900/60 pt-2 mt-2 font-bold flex justify-between text-[11px]">
                    <span className="text-[#f4f4f5]">Net Amount Charged:</span>
                    <span className="text-emerald-400">${invoiceLog.total_charged_usd.toFixed(2)} USD</span>
                  </div>
                  <div className="border-t border-dashed border-zinc-900/80 pt-2 mt-2 text-[9px] text-zinc-600 uppercase flex gap-1.5 items-center">
                    <FolderSync className="w-3.5 h-3.5 text-indigo-400/80 shrink-0" />
                    <span>Rollover Vault: {invoiceLog.tokens_remaining_rolled_over} Tokens rolled over safely for next months.</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
