import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { User, Key, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE } from '../config/apiConfig';

export default function Settings() {
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // NOTE: In a full app, AuthContext should also have an updateUser function to sync state
      await axios.put(`${API_BASE}/user/profile`, { name }, { withCredentials: true });
      setSuccess('Profile updated successfully');
      toast.success('Profile updated');
    } catch (err) {
      const errorResponse = err.response?.data?.error;
      const errorMessage = typeof errorResponse === 'object' ? errorResponse.message : errorResponse;
      setError(errorMessage || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    try {
      await axios.put(`${API_BASE}/user/password`, {
        currentPassword,
        newPassword
      }, { withCredentials: true });
      setSuccess('Password updated successfully');
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errorResponse = err.response?.data?.error;
      const errorMessage = typeof errorResponse === 'object' ? errorResponse.message : errorResponse;
      setError(errorMessage || 'Failed to update password');
      toast.error('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm font-mono text-text-secondary uppercase tracking-widest mt-1">Operator Preferences</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-negative/10 border border-negative/30 text-negative px-4 py-3 rounded-lg text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-positive/10 border border-positive/30 text-positive px-4 py-3 rounded-lg text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Profile Identity</h2>
              <p className="text-xs text-text-secondary">Update your operator name</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Operator Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-background border border-border focus:border-accent rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Operator ID (Email)</label>
              <input 
                type="email" 
                value={user?.email || ''}
                disabled
                className="w-full bg-background/50 border border-border/50 text-text-secondary rounded-lg px-4 py-2.5 text-sm cursor-not-allowed"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={profileLoading}
                className="interactive-btn w-full bg-accent text-background hover:bg-accent/90 font-bold text-sm uppercase tracking-wider rounded-lg py-3 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {profileLoading ? 'Updating...' : <><Save className="w-4 h-4" /> Save Profile</>}
              </button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Security Credentials</h2>
              <p className="text-xs text-text-secondary">Update your access key</p>
            </div>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Current Access Key</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-background border border-border focus:border-warning rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">New Access Key</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-background border border-border focus:border-warning rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Verify New Key</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-background border border-border focus:border-warning rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={passwordLoading}
                className="interactive-btn w-full bg-warning text-background hover:bg-warning/90 font-bold text-sm uppercase tracking-wider rounded-lg py-3 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {passwordLoading ? 'Updating...' : <><Key className="w-4 h-4" /> Update Key</>}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
