// pages/AdminLogin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cek apakah sudah login
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (token) {
          const response = await fetch('http://localhost:5000/api/admin/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
      }
    };

    checkAdminAuth();
  }, [navigate]);

  // AdminLogin.tsx - Perbaiki bagian handleSubmit
// AdminLogin.tsx - PERBAIKI bagian handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // ⚠️ DEBUG: Log data yang akan dikirim
  console.log('📤 Sending login data:', { email, password });

  try {
    const response = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,      // ← GUNAKAN STATE email, BUKAN formData.email
        password: password // ← GUNAKAN STATE password, BUKAN formData.password
      }),
    });

    // ⚠️ DEBUG: Log raw response
    console.log('📥 Raw response status:', response.status);
    
    const data = await response.json();
    console.log('📥 Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    console.log('✅ Login response:', data);

    // Simpan data admin ke localStorage
    if (data.success && data.user) {
      localStorage.setItem('admin', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role
      }));
      
      // Juga simpan token jika ada
      if (data.token) { // ← PERHATIKAN: backend mengembalikan 'token', bukan 'session.access_token'
        localStorage.setItem('admin_token', data.token);
      }

      console.log('📦 Admin data saved to localStorage');
      
      // Redirect ke dashboard
      window.location.href = '/admin/dashboard';
    } else {
      throw new Error('Invalid response data');
    }

  } catch (err: any) {
    console.error('❌ Login error:', err);
    setError(err.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 mt-2">Masuk ke dashboard admin</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="rickysilaban384@gmail.com"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div> {/* <- Tutup Login Card */}

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
