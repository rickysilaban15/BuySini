import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import SearchBar from "./SearchBar";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const { products } = useProducts();
  const navigate = useNavigate();

  // Deteksi scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check admin login status - FIXED: Tidak pakai localhost:5000
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const adminData = localStorage.getItem("admin");
        
        if (adminData) {
          const parsed = JSON.parse(adminData);
          // Cek langsung dari localStorage
          if (parsed.role === 'admin' && parsed.email) {
            setIsAdminLoggedIn(true);
          } else {
            // Data tidak valid, clear
            localStorage.removeItem("admin");
            localStorage.removeItem("admin_token");
            setIsAdminLoggedIn(false);
          }
        } else {
          setIsAdminLoggedIn(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAdminLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminAuth();
  }, []);

  const navigationItems = [
    { name: "𝗦𝗵𝗼𝗽𝗽𝗶𝗻𝗴", href: "/products" },
    { name: "𝗞𝗮𝘁𝗲𝗴𝗼𝗿𝗶", href: "/category" },
    { name: "𝗣𝗿𝗼𝗺𝗼", href: "/promo" },
    { name: "𝗧𝗲𝗻𝘁𝗮𝗻𝗴", href: "/about" },
    { name: "𝗞𝗼𝗻𝘁𝗮𝗸", href: "/contact" },
    { name: "𝗟𝗮𝗰𝗮𝗸 𝗣𝗲𝘀𝗮𝗻𝗮𝗻", href: "/track-order" },
  ];

  const adminMenuItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: Settings },
    { name: "Kelola Produk", href: "/admin/products", icon: Settings },
    { name: "Kelola Pesanan", href: "/admin/orders", icon: Settings },
    { name: "Kelola Kategori", href: "/admin/categories", icon: Settings },
  ];

  // FIXED: Logout tanpa panggil localhost:5000
  const handleAdminLogout = async () => {
    // Hapus semua admin data dari localStorage
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin");
    
    setIsAdminLoggedIn(false);
    setIsAdminDropdownOpen(false);
    navigate("/");
    
    console.log("✅ Admin logged out successfully");
  };

  const handleAdminAction = () => {
    if (isAdminLoggedIn) {
      setIsAdminDropdownOpen(!isAdminDropdownOpen);
    } else {
      navigate("/admin/login");
    }
  };

  if (isCheckingAuth) {
    return (
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="animate-pulse bg-gray-200 rounded h-10 w-32"></div>
            <div className="animate-pulse bg-gray-200 rounded h-10 w-24"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-500 ${
        isScrolled
          ? "bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-md border-b border-gray-300 dark:border-gray-700"
          : "bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
              <img
                src="/logobuy.png"
                alt="Buysini"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                𝑩𝒖𝒚𝑺𝒊𝒏𝒊
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center space-x-4">
            {/* Desktop Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <SearchBar
                products={products}
                onProductSelect={(product) => navigate(`/product/${product.slug}`)}
              />
            </div>

            {/* Admin Section */}
            <div className="relative">
              {isAdminLoggedIn ? (
                // Admin Logged In - Dropdown Menu
                <div className="relative">
                  <button
                    onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>

                  {/* Admin Dropdown Menu */}
                  {isAdminDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Admin Panel</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Selamat datang!</p>
                      </div>
                      
                      {adminMenuItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsAdminDropdownOpen(false)}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                        <button
                          onClick={handleAdminLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Admin Login Button
                <button
                  onClick={handleAdminAction}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors group"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Login Admin</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <SearchBar
            products={products}
            onProductSelect={(product) => navigate(`/product/${product.slug}`)}
          />
        </div>

        {isMenuOpen && (
          <div className="lg:hidden pb-4 animate-in fade-in-80">
            <nav className="flex flex-col space-y-2 
              bg-gradient-to-b from-indigo-600 via-purple-700 to-gray-900
              text-white rounded-lg p-4 shadow-xl border border-indigo-500/30">
              
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="px-4 py-3 text-white hover:text-indigo-300 hover:bg-white/10 rounded-lg transition-all duration-300 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Admin Section */}
              <div className="border-t border-white/20 pt-4 mt-2">
                {isAdminLoggedIn ? (
                  <>
                    <p className="px-4 py-2 text-sm font-medium text-white mb-2">
                      Admin Panel
                    </p>
                    {adminMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-white hover:text-indigo-300 hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                    <button
                      onClick={handleAdminLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-500 hover:bg-white/10 rounded-lg transition-colors mt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout Admin</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      navigate("/admin/login");
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-lg text-center font-semibold hover:opacity-90 transition-colors"
                  >
                    Login Admin
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Backdrop for dropdown */}
      {isAdminDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsAdminDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
