'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function LoginPage({
  onLoginSuccess,
  onBackClick,
}: {
  onLoginSuccess: (userData: any) => void;
  onBackClick: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dummy credentials untuk demo
  const VALID_EMAIL = 'admin@clairvo.com';
  const VALID_PASSWORD = 'password123';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulasi proses login
    setTimeout(() => {
      if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        onLoginSuccess({
          name: 'Admin Bengkel',
          email: email,
        });
      } else {
        setError('Email atau password salah. Coba: admin@clairvo.com / password123');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-gray-800/80 backdrop-blur border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/clairvo-logo-white.png"
                alt="Clairvo Logo"
                width={48}
                height={48}
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
            <p className="text-gray-400">Masuk ke sistem monitoring bengkel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@clairvo.com"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Demo Credentials Info */}
            <div className="bg-blue-500/10 border border-blue-500/50 text-blue-300 px-4 py-3 rounded-lg text-xs">
              <strong>Demo:</strong> admin@clairvo.com / password123
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6"
            >
              {loading ? 'Sedang Login...' : 'Masuk'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-6">
            &copy; 2025 Clairvo Team. Air Quality Monitoring System.
          </p>
        </div>
      </div>
    </div>
  );
}
