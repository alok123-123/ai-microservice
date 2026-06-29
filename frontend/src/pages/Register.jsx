import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, UserPlus, Key, Lock, AlertTriangle, Fingerprint } from 'lucide-react';
import { Card } from '../components/ui/Card';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      const errorResponse = err.response?.data?.error;
      const errorMessage = typeof errorResponse === 'object' ? errorResponse.message : errorResponse;
      setError(errorMessage || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden animate-fade-in">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <main className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-premium border border-accent/20 flex items-center justify-center shadow-[0_0_30px_rgba(22,224,189,0.15)]">
              <Fingerprint className="w-8 h-8 text-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
            Terminal Access
          </h1>
          <p className="text-sm font-mono text-text-secondary uppercase tracking-widest">
            Request Operator Authorization
          </p>
        </div>

        <Card className="p-8 backdrop-blur-2xl bg-card/60">
          {error && (
            <div className="flex items-center gap-3 bg-negative/10 border border-negative/30 text-negative px-4 py-3 rounded-lg mb-6 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2" htmlFor="full-name">
                <User className="w-3.5 h-3.5" />
                Full Name
              </label>
              <input 
                id="full-name" 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe" 
                required
                className="bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-4 py-3 text-sm text-text-primary transition-all w-full placeholder-text-secondary/50 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2" htmlFor="operator-id">
                <UserPlus className="w-3.5 h-3.5" />
                Operator ID (Email)
              </label>
              <input 
                id="operator-id" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter identification string" 
                required
                className="bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-4 py-3 text-sm text-text-primary transition-all w-full placeholder-text-secondary/50 outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2" htmlFor="access-key">
                <Key className="w-3.5 h-3.5" />
                Access Key
              </label>
              <input 
                id="access-key" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter encrypted key" 
                required
                className="bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-4 py-3 text-sm text-text-primary transition-all w-full placeholder-text-secondary/50 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2" htmlFor="confirm-key">
                <Lock className="w-3.5 h-3.5" />
                Verify Access Key
              </label>
              <input 
                id="confirm-key" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter encrypted key" 
                required
                className="bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-4 py-3 text-sm text-text-primary transition-all w-full placeholder-text-secondary/50 outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="interactive-btn bg-accent text-background hover:bg-accent/90 font-bold text-sm uppercase tracking-wider rounded-lg py-3.5 mt-2 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 w-full"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background"></div>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  Request Authorization
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-border">
            <Link to="/login" className="text-xs font-mono text-text-secondary hover:text-accent transition-colors">
              Already Authorized? Initialize Access
            </Link>
          </div>
        </Card>

        <div className="mt-8 flex justify-center items-center gap-2 font-mono text-[10px] text-text-secondary/60 uppercase tracking-widest">
          <Lock className="w-3 h-3" />
          Secured by Quantum-Grade Encryption
        </div>
      </main>
    </div>
  );
}
