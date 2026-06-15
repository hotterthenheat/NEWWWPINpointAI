import React, { useState } from 'react';
import { Shield, Key, Copy, CheckCircle2, ChevronRight, Download } from 'lucide-react';

export function TwoFactorFlow() {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0); // 0 is idle/not enabled
  const [password, setPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mocking the generation of backup codes
  const generateBackupCodes = () => {
    return Array.from({ length: 10 }, () => 
      `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    );
  };

  const handlePasswordSubmit = async () => {
    setError('');
    if (!password) {
      setError('Password is required');
      return;
    }
    setIsLoading(true);
    // Simulate password check against backend
    setTimeout(() => {
      setIsLoading(false);
      if (password === 'password123' || password.length >= 6) { // Accept any reasonably long string as mock
        setStep(2);
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    }, 800);
  };

  const handleVerifyCode = async () => {
    setError('');
    if (authCode.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(4); // Verification success
    }, 800);
  };

  const handleCompleteSetup = () => {
    setBackupCodes(generateBackupCodes());
    setStep(5);
  };

  if (step === 0) {
    return (
      <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center justify-between transition-all">
        <div>
          <div className="text-sm font-bold text-white mb-1">Two-Factor Authentication (TOTP)</div>
          <div className="text-xs text-zinc-500">Secure your account with an Authenticator app.</div>
        </div>
        <button 
          onClick={() => setStep(1)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap"
        >
          Enable 2FA
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 bg-black/40 border border-indigo-500/30 rounded-xl space-y-4 animate-fadeIn transition-all">
      <div className="flex items-center gap-2 mb-2 pb-3 border-b border-zinc-900/80">
        <Shield className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">2FA Setup Flow</h3>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-xs text-zinc-400">
            <strong>Step 1: Security Handshake.</strong> Please confirm your current password to continue setting up Two-Factor Authentication.
          </div>
          <div className="space-y-2">
            <input 
              type="password" 
              placeholder="Current Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {error && <div className="text-xs font-bold text-rose-500">{error}</div>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setStep(0)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors cursor-pointer">Cancel</button>
            <button 
              onClick={handlePasswordSubmit} 
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? 'Verifying...' : 'Verify Password'} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-xs text-zinc-400">
            <strong>Step 2: Authenticator Setup.</strong> Scan this QR code with Google Authenticator, Authy, or your preferred TOTP app.
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 bg-white rounded-lg p-2 shrink-0 border-2 border-indigo-500/30">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/PinPointAI?secret=JBSWY3DPEHPK3PXP`} alt="QR Code" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-2 flex-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Manual Entry Key</span>
              <div className="flex border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
                <div className="flex-1 px-3 py-2 text-xs font-mono text-zinc-300 align-middle">JBSWY3DPEHPK3PXP</div>
                <button className="px-3 bg-zinc-900 border-l border-zinc-800 hover:bg-zinc-800 text-zinc-400 cursor-pointer">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setStep(0)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors cursor-pointer">Cancel</button>
            <button onClick={() => setStep(3)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2">
              Next Step <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-xs text-zinc-400">
            <strong>Step 3: Verification Check.</strong> Enter the 6-digit code from your authenticator app to confirm setup.
          </div>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="000000" 
              maxLength={6}
              value={authCode}
              onChange={e => setAuthCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-lg text-center font-mono tracking-[0.5em] text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {error && <div className="text-xs font-bold text-rose-500">{error}</div>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setStep(0)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors cursor-pointer">Cancel Setup</button>
            <button 
              onClick={handleVerifyCode} 
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? 'Checking...' : 'Verify Code'} <CheckCircle2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-fadeIn text-center py-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h4 className="text-sm font-bold text-white">2FA Enabled Successfully</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Your account is now protected with Two-Factor Authentication.
          </p>
          <div className="pt-4">
            <button onClick={handleCompleteSetup} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer w-full flex items-center justify-center gap-2">
              Generate Backup Codes <Key className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-xs text-zinc-400">
            <strong>Step 5: Emergency Backup Codes.</strong> Save these 10 recovery codes in a secure location. Each code can only be used once. If you lose your device, these are your only way back in.
          </div>
          
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-4 border border-zinc-900 rounded-lg max-h-48 overflow-y-auto">
            {backupCodes.map((code, idx) => (
              <div key={idx} className="text-xs font-mono text-emerald-400 tracking-wider flex items-center justify-between border-b border-zinc-900 last:border-0 pb-1">
                <span>{idx + 1}.</span>
                <span>{code}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2">
              Download .TXT <Download className="w-3 h-3" />
            </button>
            <button onClick={() => setStep(0)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2">
              Acknowledge & Close <CheckCircle2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
