import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../shared/context/AuthContext';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../../shared/components/Loading';

export function LoginPage() {
  const { user, login, loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please provide both your username and password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithCredentials(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const rawMessage = err?.message || '';
      if (
        rawMessage.includes('Missing or insufficient permissions') ||
        rawMessage.toLowerCase().includes('permission') ||
        rawMessage.includes('Invalid username or password')
      ) {
        setError('Invalid username or password.');
      } else {
        setError(rawMessage || 'Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await login();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google sign-in was interrupted. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-center items-center p-4 sm:p-8 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_40%,_rgba(59,130,246,0.12)_0%,_transparent_70%)]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent-primary/10 blur-[100px] -z-10" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent-soft/10 blur-[100px] -z-10" />

      {/* Top back button */}
      <div className="w-full max-w-md mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-accent-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-bg-card/90 border border-border-subtle rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative"
      >
        {/* Brand / Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="flex items-center gap-3 group mb-4">
            <img
              src="https://res.cloudinary.com/dydhpzure/image/upload/v1777735809/awectavedp0w33t4q32k.png"
              alt="KuraDex"
              className="w-10 h-10 object-contain group-hover:rotate-6 transition-transform"
            />
            <span className="text-xl font-black tracking-[0.2em] uppercase text-text-main">
              Kura<span className="text-accent-soft">Dex</span>
            </span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-text-main uppercase tracking-tight">
            Log In
          </h1>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">
            Access your figure collection
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </motion.div>
        )}

        {/* Username & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-username"
              className="block text-[11px] font-bold uppercase tracking-wider text-text-muted"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading || googleLoading}
                className="w-full h-12 bg-bg-surface border border-border-subtle rounded-xl pl-11 pr-4 text-sm text-text-main placeholder:text-text-muted/50 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-[11px] font-bold uppercase tracking-wider text-text-muted"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading || googleLoading}
                className="w-full h-12 bg-bg-surface border border-border-subtle rounded-xl pl-11 pr-11 text-sm text-text-main placeholder:text-text-muted/50 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-main transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full h-12 mt-2 bg-gradient-to-r from-accent-primary to-accent-soft hover:brightness-110 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-accent-primary/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <LoadingSpinner variant="white" /> : 'Log In'}
          </button>
        </form>

        {/* Word "or" */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-border-subtle w-full" />
          <span className="bg-bg-card px-4 text-xs font-bold text-text-muted uppercase tracking-widest relative">
            or
          </span>
          <div className="border-t border-border-subtle w-full" />
        </div>

        {/* Google Sign-in button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full h-12 bg-bg-surface hover:bg-bg-surface/80 border border-border-subtle hover:border-accent-primary/50 text-text-main rounded-xl font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {googleLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Sign-in</span>
            </>
          )}
        </button>

        {/* Link for register */}
        <div className="mt-8 text-center text-xs text-text-muted">
          <span>Don't have an account? </span>
          <Link
            to="/register"
            className="text-accent-primary hover:text-accent-soft font-bold uppercase tracking-wider underline underline-offset-4 transition-colors"
          >
            register
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
