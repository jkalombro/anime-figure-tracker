import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../lib/cloudinary';
import { Camera, Check, User } from 'lucide-react';
import { LoadingSpinner } from '../components/Loading';

export function SettingsPage() {
  const { user, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile({ displayName });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const url = await uploadImage(file);
      await updateUserProfile({ photoURL: url });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <header>
        <h2 className="text-3xl font-black text-text-main tracking-tight uppercase">Settings</h2>
        <p className="text-text-muted mt-2">Adjust your Gallery's identity parameters.</p>
      </header>

      <div className="surface-container p-8 sm:p-12 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-bg-surface shadow-2xl relative">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-accent-primary/10 flex items-center justify-center">
                  <User className="w-12 h-12 text-accent-primary" />
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <LoadingSpinner variant="white" />
                </div>
              )}
            </div>
            
            <label className="absolute bottom-1 right-1 w-10 h-10 bg-accent-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-accent-soft transition-all active:scale-90 border-4 border-bg-surface">
              <Camera className="w-5 h-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={loading} />
            </label>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-black text-text-main uppercase tracking-tight">{user?.displayName}</h3>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">Collector ID: {user?.uid.slice(0, 8)}...</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-14 bg-white border border-border-subtle rounded-2xl px-6 text-text-main focus:ring-1 focus:ring-accent-primary outline-none transition-all font-bold"
              placeholder="Your handle..."
              required
              autoComplete="off"
            />
          </div>

          <button
            disabled={loading || displayName === user?.displayName || !displayName.trim()}
            className="w-full h-16 bg-gradient-to-br from-accent-primary to-accent-red text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-accent-primary/20 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner variant="white" /> : success ? <><Check className="w-5 h-5" /> Updated</> : 'Update Profile'}
          </button>
        </form>
      </div>

      <div className="p-8 border border-border-subtle rounded-[2rem] bg-bg-surface/40">
        <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-4">Account Metadata</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-bg-card rounded-xl border border-border-subtle">
            <p className="text-[10px] uppercase font-black text-text-muted mb-1">Email Connection</p>
            <p className="text-sm font-bold text-text-main">{user?.email}</p>
          </div>
          <div className="p-4 bg-bg-card rounded-xl border border-border-subtle">
            <p className="text-[10px] uppercase font-black text-text-muted mb-1">Verification Status</p>
            <p className="text-sm font-bold text-accent-soft">{user?.emailVerified ? 'VERIFIED' : 'PENDING'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
