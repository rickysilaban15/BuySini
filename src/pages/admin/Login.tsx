// pages/AdminLogin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { supabaseAdmin } from '../lib/supabase-admin'; // Import supabase admin client

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cek apakah sudah login - SIMPLIFIED
  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const adminData = localStorage.getItem('admin');
        if (adminData) {
          navigate('/admin/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Auth check error:', err);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
      }
    };

    checkAdminAuth();
  }, [navigate]);

  // LOGIN DENGAN SUPABASE - TANPA BACKEND SERVER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Login attempt:', email);

    try {
      // Query langsung ke Supabase table admins
      const { data: admin, error } = await supabaseAdmin
        .from('admins')
        .select('id, full_name, email, role, password')
        .eq('email', email)
        .eq('password', password) // Password disimpan sebagai plain text
        .single();

      console.log('📦 Supabase response:', { admin, error });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error('Email atau password salah');
      }

      if (!admin) {
        throw new Error('Admin tidak ditemukan');
      }

      console.log('✅ Login successful:', admin.full_name);

      // Simpan data admin ke localStorage
      localStorage.setItem('admin', JSON.stringify({
        id: admin.id,
        name: admin.full_name, // Gunakan full_name dari database
        email: admin.email,
        role: admin.role
      }));

      // Generate simple token
      localStorage.setItem('admin_token', 'supabase_admin_' + Date.now());

      console.log('💾 Data saved to localStorage');
      
      // Redirect ke dashboard
      window.location.href = '/admin/dashboard';

    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login gagal');
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
                placeholder="admin@belidisini.com"
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

          {/* Debug Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              Test credentials:<br/>
              <strong>admin@belidisini.com</strong> / <strong>admin123</strong><br/>
              <strong>rickysilaban384@gmail.com</strong> / <strong>password123</strong>
            </p>
          </div>
        </div>

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
