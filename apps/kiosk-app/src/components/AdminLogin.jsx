import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, User, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim()) {
      setError('Username cannot be empty.');
      setLoading(false);
      return;
    }
    
    if (!password.trim()) {
      setError('Password cannot be empty.');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      if (username !== 'admin') {
        setError('Username not found in system.');
      } else if (password !== 'admin123') {
        setError('Incorrect password. Please try again.');
      } else {
        onLogin(true);
        return;
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
      {/* Background Animated Orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[120px]"
          animate={{ x: [0, 40, 0], y: [0, 80, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[20%] w-[50vw] h-[50vw] rounded-full bg-cyan-400/10 blur-[120px]"
          animate={{ x: [0, -40, 0], y: [0, -60, 0] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-3xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-4 transform rotate-3">
            <ShieldCheck className="w-8 h-8 text-white -rotate-3" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Admin Portal Login
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Enter credentials to access
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200 flex items-start gap-3 text-red-800 text-sm backdrop-blur-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 ml-1">
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/80 border border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-gray-900 placeholder-gray-400 font-medium transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/80 border border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-gray-900 placeholder-gray-400 font-medium transition-all outline-none ${!showPassword ? 'tracking-widest' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-700/20 hover:shadow-blue-700/40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In to Portal
              </span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
