// pages/AdminLogin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Import Supabase client

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cek apakah sudah login - PERBAIKI
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const adminData = localStorage.getItem('admin');
        
        if (adminData) {
          const parsed = JSON.parse(adminData);
          // Simple validation - jika ada admin data di localStorage, consider sebagai logged in
          if (parsed.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            localStorage.removeItem('admin');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        localStorage.removeItem('admin');
      }
    };

    checkAdminAuth();
  }, [navigate]);

  // PERBAIKI handleSubmit - Gunakan Supabase Auth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('📤 Sending login data:', { email, password });

    try {
      // ✅ GUNAKAN SUPABASE AUTH - GANTI BACKEND API CALL
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      console.log('📥 Supabase response:', { data, error: supabaseError });

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Login failed');
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      console.log('✅ Login successful:', data.user);

      // Simpan data admin ke localStorage
      localStorage.setItem('admin', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 'Admin',
        role: 'admin'
      }));

      // Juga simpan session jika perlu
      if (data.session) {
        localStorage.setItem('admin_token', data.session.access_token);
      }

      console.log('📦 Admin data saved to localStorage');
      
      // Redirect ke dashboard
      navigate('/admin/dashboard', { replace: true });

    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Atau JIKA MAU PAKAI HARDCODED CREDENTIALS (Lebih Simple):
  const handleSubmitSimple = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Hardcoded admin credentials untuk sementara
    const adminCredentials = [
      { 
        email: 'admin@belidisini.com', 
        password: 'admin123', 
        name: 'Super Admin',
        role: 'admin' 
      },
      { 
        email: 'ricky@belidisini.com', 
        password: 'ricky123', 
        name: 'Ricky Admin',
        role: 'admin' 
      },
      { 
        email: 'rickysilaban384@gmail.com', 
        password: 'ricky123', 
        name: 'Ricky Silaban',
        role: 'admin' 
      }
    ];

    const admin = adminCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (admin) {
      // Simpan ke localStorage
      localStorage.setItem('admin', JSON.stringify(admin));
      console.log('✅ Admin logged in:', admin.email);
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError('Email atau password salah');
    }

    setLoading(false);
  };

  // Pilih salah satu:
  // onSubmit={handleSubmit}       // Untuk Supabase Auth
  // onSubmit={handleSubmitSimple} // Untuk hardcoded credentials

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

          <form onSubmit={handleSubmitSimple} className="space-y-6"> {/* GANTI DI SINI */}
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
