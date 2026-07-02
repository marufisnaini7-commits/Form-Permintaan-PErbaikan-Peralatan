/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, Lock, ArrowLeft, KeyRound } from 'lucide-react';

interface AdminChallengeProps {
  onUnlock: () => void;
  onCancel: () => void;
}

export default function AdminChallenge({ onUnlock, onCancel }: AdminChallengeProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Accept standard admin passwords for convenience
    const validPasswords = ['adminbkhit', 'bkhitpbd', 'admin123', 'bkhit123'];
    
    if (validPasswords.includes(password.trim().toLowerCase())) {
      setError('');
      onUnlock();
    } else {
      setError('Kata sandi administrator salah. Silakan coba lagi.');
      setPassword('');
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden" id="admin-challenge-box">
      {/* Header Banner */}
      <div className="bg-slate-800 p-6 text-white text-center border-b-4 border-blue-600">
        <div className="inline-flex p-3 bg-slate-900/50 rounded-full border border-slate-700 text-blue-400 mb-3 animate-pulse">
          <Lock size={28} />
        </div>
        <h2 className="font-display font-bold text-lg tracking-wide">Akses Terbatas</h2>
        <p className="text-xs text-slate-300 mt-1">Verifikasi Administrator BKHIT PBD</p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="text-xs text-slate-600 leading-relaxed text-center">
          Halaman konfigurasi database Google Sheets dilindungi untuk mencegah perubahan tidak sengaja. Silakan masukkan kata sandi Anda.
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2 animate-shake" id="challenge-error">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Kata Sandi Administrator
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <KeyRound size={16} />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
              placeholder="Masukkan kata sandi..."
              required
              autoFocus
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Petunjuk: Kata sandi bawaan adalah <span className="font-mono font-bold">bkhitpbd</span> atau <span className="font-mono font-bold">admin123</span>
          </p>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Batal</span>
          </button>
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <span>Buka Akses</span>
          </button>
        </div>
      </form>
    </div>
  );
}
