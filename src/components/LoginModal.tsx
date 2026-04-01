import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Ticket, ArrowRight, Chrome } from 'lucide-react';
import { cn } from '../lib/utils';
import { signInWithPopup, auth, googleProvider } from '../firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'join';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = React.useState<AuthMode>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError('FAILED TO SIGN IN WITH GOOGLE. PLEASE TRY AGAIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'join' && !inviteCode) {
      setError('AN INVITATION CODE IS REQUIRED DURING BETA.');
      return;
    }

    // Mock auth logic for email/password for now
    setError('EMAIL SIGN-IN IS CURRENTLY DISABLED. PLEASE USE GOOGLE.');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-manus-dark/95 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-manus-dark border border-manus-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-8 p-2 rounded-full hover:bg-manus-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5 text-manus-white/40" />
            </button>

            <div className="p-10 pt-16">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-display font-black text-manus-white uppercase tracking-widest mb-2">
                  {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE BETA'}
                </h2>
                <p className="text-manus-white/40 text-xs font-black uppercase tracking-[0.2em]">
                  {mode === 'login' 
                    ? 'SIGN IN TO YOUR SANCTUARY' 
                    : 'AN EXCLUSIVE SPACE FOR CREATORS'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="EMAIL ADDRESS"
                      className="w-full bg-manus-white/5 border border-manus-white/10 rounded-2xl py-4 pl-14 pr-6 text-xs font-black text-manus-white placeholder:text-manus-white/20 focus:outline-none focus:border-manus-orange transition-colors uppercase tracking-widest"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="PASSWORD"
                      className="w-full bg-manus-white/5 border border-manus-white/10 rounded-2xl py-4 pl-14 pr-6 text-xs font-black text-manus-white placeholder:text-manus-white/20 focus:outline-none focus:border-manus-orange transition-colors uppercase tracking-widest"
                    />
                  </div>

                  {mode === 'join' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="relative"
                    >
                      <Ticket className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-orange" />
                      <input
                        type="text"
                        required
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="INVITATION CODE"
                        className="w-full bg-manus-orange/5 border border-manus-orange/20 rounded-2xl py-4 pl-14 pr-6 text-xs font-black text-manus-orange placeholder:text-manus-orange/40 focus:outline-none focus:border-manus-orange transition-colors uppercase tracking-widest"
                      />
                    </motion.div>
                  )}
                </div>

                {error && (
                  <p className="text-xs font-black text-manus-orange uppercase tracking-widest text-center">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-manus-white text-manus-dark hover:bg-manus-orange hover:text-manus-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {mode === 'login' ? 'SIGN IN' : 'REQUEST ACCESS'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-manus-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-manus-dark px-4 text-manus-white/20">OR CONTINUE WITH</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-manus-white/5 border border-manus-white/10 hover:bg-manus-white/10 text-manus-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Chrome className="w-4 h-4" />
                  GOOGLE ACCOUNT
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-manus-white/5 text-center">
                <button
                  onClick={() => setMode(mode === 'login' ? 'join' : 'login')}
                  className="text-xs font-black text-manus-white/40 hover:text-manus-white uppercase tracking-widest transition-colors"
                >
                  {mode === 'login' 
                    ? "DON'T HAVE AN ACCOUNT? JOIN THE BETA" 
                    : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
