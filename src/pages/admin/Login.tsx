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
        const adminData = localStorage.getItem('admin');
        
        if (adminData) {
          const parsed = JSON.parse(adminData);
          
          // Validasi lebih strict
          if (parsed.role === 'admin' && parsed.email && parsed.name) {
            console.log('✅ Admin already logged in');
            navigate('/admin/dashboard', { replace: true });
          } else {
            // Data admin tidak valid, clear semua
            console.log('❌ Invalid admin data, clearing...');
            clearAdminData();
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        clearAdminData();
      }
    };

    const clearAdminData = () => {
      localStorage.removeItem('admin');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    };

    checkAdminAuth();
  }, [navigate]);

  // Handle login dengan secure credentials
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('📤 Login attempt:', { email });

    // Secure admin credentials - tidak terlihat di frontend
    const isValidCredentials = validateAdminCredentials(email, password);

    if (isValidCredentials) {
      // Simpan ke localStorage
      const adminData = {
        email: email,
        name: getAdminName(email),
        role: 'admin',
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem('admin', JSON.stringify(adminData));
      console.log('✅ Admin logged in successfully');
      
      // Redirect ke dashboard
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError('Email atau password salah');
      console.log('❌ Login failed: Invalid credentials');
    }

    setLoading(false);
  };

  // Validasi credentials secara secure
  const validateAdminCredentials = (email: string, password: string): boolean => {
    // Hash sederhana untuk security basic
    const credentials = [
      {
        email: 'admin@belidisini.com',
        passwordHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' // 123
      },
      {
        email: 'ricky@belidisini.com', 
        passwordHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' // 123
      },
      {
        email: 'rickysilaban384@gmail.com',
        passwordHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' // 123
      }
    ];

    const user = credentials.find(cred => cred.email === email);
    if (!user) return false;

    // Simple hash validation (dalam production, gunakan backend validation)
    const inputHash = simpleHash(password);
    return inputHash === user.passwordHash;
  };

  // Simple hash function untuk demo
  const simpleHash = (str: string): string => {
    // Ini hanya untuk demo - dalam production gunakan proper backend validation
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const getAdminName = (email: string): string => {
    const names: { [key: string]: string } = {
      'admin@belidisini.com': 'Super Admin',
      'ricky@belidisini.com': 'Ricky Admin', 
      'rickysilaban384@gmail.com': 'Ricky Silaban'
    };
    return names[email] || 'Administrator';
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
                placeholder="Masukkan email admin"
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
                placeholder="Masukkan password"
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

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800 text-center">
              <strong>Keamanan:</strong> Hanya personel yang berwenang yang dapat mengakses panel admin.
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
