import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, User, CheckCircle2, X } from 'lucide-react';
import Webcam from 'react-webcam';

interface UserProfileProps {
  session: any;
  onUpdateSession: () => void;
}

export function UserProfile({ session, onUpdateSession }: UserProfileProps) {
  const [nickname, setNickname] = useState(() => {
    return session?.name || '';
  });
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return session?.avatar || '';
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nickname,
          avatar: avatarUrl
        })
      });
      if (res.ok) {
        onUpdateSession();
      }
    } catch (e) {
      console.error('Failed to update profile', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadToCDN = async (base64Data: string) => {
    setIsUploadingImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data })
      });
      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.cdnUrl);
      }
    } catch (e) {
      console.error('Failed to upload image to CDN', e);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        uploadToCDN(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      uploadToCDN(imageSrc);
      setIsCameraOpen(false);
    }
  }, [webcamRef]);

  return (
    <div className="bg-black/20 border border-zinc-900 rounded-xl p-6 space-y-5 relative shadow-lg">
      <div className="absolute top-0 right-0 p-3 text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-mono">
        Profile Preferences
      </div>

      <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
        <User className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-black tracking-tight text-white">
          User Profile
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 flex items-center justify-center group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-zinc-700" />
            )}
            <div 
              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => setIsCameraOpen(true)}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors uppercase tracking-wider bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/20"
            >
              <Upload className="w-3 h-3" />
              Upload
            </button>
            <button 
              onClick={() => setIsCameraOpen(true)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20"
            >
              <Camera className="w-3 h-3" />
              Camera
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold block uppercase tracking-wider">Display Nickname</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-black/40 border border-zinc-900 focus:border-indigo-500/50 text-white rounded-lg p-2.5 text-sm transition-colors focus:outline-none placeholder-zinc-700 font-mono"
              placeholder="Enter your display name"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isUpdating}
            className="py-2.5 px-4 bg-zinc-900 border border-zinc-800 hover:bg-indigo-500/10 text-indigo-400 hover:border-indigo-500/50 rounded-lg text-sm font-bold flex items-center justify-center transition-all cursor-pointer w-40 gap-2 uppercase tracking-wide"
          >
            {isUpdating ? 'Saving...' : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-widest font-mono">Capture Photo</span>
              </div>
              <button 
                onClick={() => setIsCameraOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative aspect-square sm:aspect-video bg-black overflow-hidden flex items-center justify-center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-4 bg-[#0a0a0c] flex justify-center border-t border-zinc-900">
              <button
                onClick={capturePhoto}
                className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs rounded-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
