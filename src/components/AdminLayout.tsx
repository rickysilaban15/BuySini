// components/AdminLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Users,
  Image as ImageIcon,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  User,
  ChevronDown,
  Package2,
  Gift,
  BarChart3,
  FileText,
  Globe,
  HeadphonesIcon,
  Mail,
  Phone,
  MapPin,
  Monitor,
  Palette,
  MessageCircle,
  CreditCard,
  Truck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.ts';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Produk', path: '/admin/products', icon: Package },
    { name: 'Kategori', path: '/admin/categories', icon: FolderOpen },
    { name: 'Pesanan', path: '/admin/orders', icon: ShoppingCart, badge: orderCount },
    { name: 'Item Pesanan', path: '/admin/orderitems', icon: Package2 },
    { name: 'Pelanggan', path: '/admin/customers', icon: Users },
    { name: 'Banner', path: '/admin/banners', icon: ImageIcon },
    { name: 'Promos', path: '/admin/promos', icon: Gift },
    { name: 'Metode Pembayaran', path: '/admin/payment-methods', icon: CreditCard },
    { name: 'Ekspedisi', path: '/admin/shipping-methods', icon: Truck },
  ];

  // Fetch all settings
  useEffect(() => {
    fetchSiteSettings();
  }, []);

  // Fetch orders count and subscribe to real-time updates
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending');
      
      if (!error) {
        setOrderCount(data?.length || 0);
      }
    };

    fetchOrders();

    // Subscribe to real-time orders
    const subscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending'
        },
        async (payload) => {
          setOrderCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=neq.pending'
        },
        () => {
          setOrderCount(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      const settingsObj: Record<string, string> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });

      setSiteSettings(settingsObj);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSiteSetting = async (key: string, value: string, type: string = 'text', description?: string) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          { 
            key, 
            value, 
            type,
            description,
            updated_at: new Date().toISOString() 
          },
          {
            onConflict: 'key',
            ignoreDuplicates: false
          }
        );

      if (error) {
        console.error('Error upserting setting:', error);
        
        const { data: existing } = await supabase
          .from('settings')
          .select('id')
          .eq('key', key)
          .single();

        if (existing) {
          const { error: updateError } = await supabase
            .from('settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('settings')
            .insert([{ key, value, type, description }]);

          if (insertError) throw insertError;
        }
      }

      setSiteSettings(prev => ({ ...prev, [key]: value }));
      return { success: true };
    } catch (error) {
      console.error('Error updating setting:', error);
      return { success: false, error };
    }
  };

  const getSetting = (key: string, defaultValue: string = '') => {
    return siteSettings[key] || defaultValue;
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('menu-button');
      const userMenu = document.getElementById('user-menu');
      const settingsMenu = document.getElementById('settings-menu');
      
      if (sidebarOpen && sidebar && !sidebar.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
      
      if (userMenuOpen && userMenu && !userMenu.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      
      if (settingsMenuOpen && settingsMenu && !settingsMenu.contains(event.target as Node)) {
        setSettingsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, userMenuOpen, settingsMenuOpen]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🚪 Logout initiated');
    
    // Clear all admin-related data
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin');
    
    console.log('✅ LocalStorage cleared');
    
    // Close dropdown
    setUserMenuOpen(false);
    
    // Navigate to login page with replace to prevent going back
    navigate('/admin/login', { replace: true });
    
    console.log('🔀 Navigated to login page');
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem?.name || 'Admin Panel';
  };

  const handleNotificationClick = () => {
    // Reset order count when notifications are clicked
    setOrderCount(0);
    navigate('/admin/orders');
  };

  const SettingsDropdown = () => (
    <div className="absolute right-0 z-10 mt-2.5 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Pengaturan Website</h3>
        <p className="text-xs text-gray-500">Kelola tampilan dan kontak</p>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {/* General Settings */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Umum
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nama Website:</span>
              <span className="font-medium">{getSetting('site_name', 'Buysini')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Footer Settings */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Footer & Kontak
          </h4>
          <div className="space-y-2 text-sm">
            <button
              onClick={() => {
                navigate('/admin/settings?section=footer');
                setSettingsMenuOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Edit Footer
            </button>
            <button
              onClick={() => {
                navigate('/admin/settings?section=contact');
                setSettingsMenuOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <HeadphonesIcon className="w-4 h-4" />
              Info Kontak
            </button>
            <button
              onClick={() => {
                navigate('/admin/settings?section=social');
                setSettingsMenuOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Media Sosial
            </button>
          </div>
        </div>

        {/* Header & Appearance */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Tampilan
          </h4>
          <div className="space-y-2 text-sm">
            <button
              onClick={() => {
                navigate('/admin/settings?section=header');
                setSettingsMenuOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Header & Logo
            </button>
            <button
              onClick={() => {
                navigate('/admin/settings?section=appearance');
                setSettingsMenuOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              Tema & Warna
            </button>
          </div>
        </div>

        {/* Quick Contact Info */}
        <div className="px-4 py-3">
          <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
            <HeadphonesIcon className="w-4 h-4" />
            Kontak Cepat
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              <span>{getSetting('contact_phone', '+62 878-1889-4504')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span>{getSetting('contact_email', 'info@buysini.com')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{getSetting('contact_address', 'Jakarta Timur')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-gray-100">
        <button
          onClick={() => {
            navigate('/admin/settings');
            setSettingsMenuOpen(false);
          }}
          className="w-full text-center py-2 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Buka Panel Pengaturan Lengkap
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${
        desktopSidebarOpen ? 'w-72' : 'w-20'
      }`}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-xl">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logobuy.png" alt="Buysini" className="w-full h-full object-contain" />
              </div>
              {desktopSidebarOpen && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {getSetting('site_name', 'Buysini')}
                  </h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <li key={item.path}>
                        <button
                          onClick={() => navigate(item.path)}
                          className={`group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 shrink-0 ${
                              isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                            }`}
                          />
                          {desktopSidebarOpen && (
                            <>
                              <span className="truncate">{item.name}</span>
                              {item.badge && item.badge > 0 && (
                                <span className={`ml-auto inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                                  isActive
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-red-100 text-red-600 group-hover:bg-red-200'
                                }`}>
                                  {item.badge > 99 ? '99+' : item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      </li>
                    );
                  })}
                  
                  {/* Settings Section with Dropdown */}
                  <li>
                    <div className="relative">
                      <button
                        onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                        className={`group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          settingsMenuOpen || location.pathname.startsWith('/admin/settings')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        <Settings
                          className={`h-6 w-6 shrink-0 ${
                            settingsMenuOpen || location.pathname.startsWith('/admin/settings')
                              ? 'text-blue-700'
                              : 'text-gray-400 group-hover:text-blue-700'
                          }`}
                        />
                        {desktopSidebarOpen && (
                          <>
                            <span className="truncate">Pengaturan</span>
                            <ChevronDown 
                              className={`ml-auto h-5 w-5 transition-transform ${
                                settingsMenuOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </>
                        )}
                      </button>

                      {settingsMenuOpen && desktopSidebarOpen && (
                        <div className="ml-6 mt-1 space-y-1">
                          <button
                            onClick={() => {
                              navigate('/admin/settings?section=general');
                              setSettingsMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 text-gray-700 flex items-center gap-2"
                          >
                            <Monitor className="w-4 h-4" />
                            Umum
                          </button>
                          <button
                            onClick={() => {
                              navigate('/admin/settings?section=footer');
                              setSettingsMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 text-gray-700 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Footer
                          </button>
                          <button
                            onClick={() => {
                              navigate('/admin/settings?section=header');
                              setSettingsMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 text-gray-700 flex items-center gap-2"
                          >
                            <Globe className="w-4 h-4" />
                            Header
                          </button>
                          <button
                            onClick={() => {
                              navigate('/admin/settings?section=contact');
                              setSettingsMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 text-gray-700 flex items-center gap-2"
                          >
                            <HeadphonesIcon className="w-4 h-4" />
                            Kontak
                          </button>
                          <div className="border-t pt-2 mt-1">
                            <button
                              onClick={() => {
                                navigate('/admin/settings');
                                setSettingsMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 text-blue-600 font-medium flex items-center gap-2"
                            >
                              <Settings className="w-4 h-4" />
                              Semua Pengaturan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                </ul>
              </li>

              {/* System Status */}
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  {desktopSidebarOpen && (
                    <div className="text-sm leading-6">
                      <p className="font-semibold text-gray-900">Status Sistem</p>
                      <p className="text-gray-500">
                        {getSetting('site_name', 'Buysini')} - Online
                      </p>
                    </div>
                  )}
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className={`relative z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}
      >
        <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white px-6 pb-4 shadow-xl">
          {/* Mobile Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logobuy.png" alt="Buysini" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {getSetting('site_name', 'Buysini')}
                </h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex flex-1 flex-col mt-5">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <li key={item.path}>
                        <button
                          onClick={() => {
                            navigate(item.path);
                            setSidebarOpen(false);
                          }}
                          className={`group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 shrink-0 ${
                              isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                            }`}
                          />
                          <div className="flex items-center justify-between flex-1">
                            <span className="truncate">{item.name}</span>
                            {item.badge && item.badge > 0 && (
                              <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                                isActive
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                  
                  {/* Settings for Mobile */}
                  <li>
                    <button
                      onClick={() => {
                        navigate('/admin/settings');
                        setSidebarOpen(false);
                      }}
                      className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Settings className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-700" />
                      <span className="truncate">Pengaturan</span>
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        desktopSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'
      }`}>
        {/* Top Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            id="menu-button"
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            className="text-gray-500 hover:text-gray-700 hidden lg:block"
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          {/* Page Title */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold leading-6 text-gray-900">
                {getCurrentPageTitle()}
              </h1>
            </div>

            {/* Search */}
            <div className="hidden sm:flex sm:flex-1 sm:justify-center">
              <div className="w-full max-w-lg">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Cari..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            {/* Right side - FIXED: removed duplicate comment */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Quick Settings Dropdown */}
              <div className="relative" id="settings-menu">
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                  onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                  title="Pengaturan Cepat"
                >
                  <Settings className="h-6 w-6" />
                </button>
                {settingsMenuOpen && <SettingsDropdown />}
              </div>

              {/* Notifications */}
              <button 
                type="button" 
                className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                onClick={handleNotificationClick}
              >
                <Bell className="h-6 w-6" />
                {orderCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {orderCount > 99 ? '99+' : orderCount}
                  </span>
                )}
              </button>

              {/* Profile dropdown */}
              <div className="relative" id="user-menu">
                <button
                  type="button"
                  className="-m-1.5 flex items-center p-1.5"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                      Admin User
                    </span>
                    <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">Admin User</p>
                      <p className="text-xs text-gray-500">admin@buysini.com</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/admin/settings');
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="mr-3 h-4 w-4 text-gray-400" />
                      Pengaturan
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="mr-3 h-4 w-4 text-red-500" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet context={{ siteSettings, updateSiteSetting, getSetting }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
