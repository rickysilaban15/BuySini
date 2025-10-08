import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Clock, AlertCircle, Copy, CheckCircle, Key, 
  CreditCard, Smartphone, Store, QrCode, Building, CheckSquare, FileText,
  Truck, Package
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShoppingBag } from "lucide-react";

interface OrderData {
  id: string;
  order_number: string;
  tracking_pin: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  customer_name: string;
  shipping_method?: string;
  shipping_cost?: number;
  subtotal?: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  logo_url: string;
  is_active: boolean;
  sort_order: number;
  instructions?: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  logo_url: string;
  is_active: boolean;
  sort_order: number;
  estimated_days?: string;
  cost: number;
}

const OrderPending = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [qrData, setQrData] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Get data dari location state
  const { orderId, trackingPin, orderNumber, total, customerName, cartData } = location.state || {};

  // Fungsi untuk generate QR data
  const generateQRData = () => {
    if (!order) return '';
    
    const data = {
      type: 'payment',
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.total_amount,
      timestamp: new Date().toISOString(),
      merchant: 'Buysini Store',
      paymentType: 'QRIS'
    };
    return JSON.stringify(data);
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else if (trackingPin) {
      const tempOrder = {
        id: orderId || 'temp',
        order_number: orderNumber || 'Loading...',
        tracking_pin: trackingPin,
        total_amount: total || 0,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        customer_name: customerName || 'Customer'
      };
      setOrder(tempOrder);
      setQrData(generateQRData());
    }
    
    // Fetch payment methods dan shipping methods dari database
    fetchPaymentMethods();
    fetchShippingMethods();

    // Setup realtime subscription
    const paymentSubscription = supabase
      .channel('payment-methods-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payment_methods' 
        }, 
        () => {
          fetchPaymentMethods();
        }
      )
      .subscribe();

    const shippingSubscription = supabase
      .channel('shipping-methods-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'shipping_methods' 
        }, 
        () => {
          fetchShippingMethods();
        }
      )
      .subscribe();

    return () => {
      paymentSubscription.unsubscribe();
      shippingSubscription.unsubscribe();
    };
  }, [orderId, trackingPin, orderNumber, total, customerName]);

  useEffect(() => {
  if (order) {
    setQrData(generateQRData());
    // Set initial values dari order yang ada
    if (order.shipping_cost) setShippingCost(order.shipping_cost);
    if (order.subtotal) setSubtotal(order.subtotal);
    if (order.total_amount) setTotalAmount(order.total_amount);
  }
}, [order]);

// Update total amount ketika shipping cost berubah
useEffect(() => {
  if (subtotal > 0) {
    setTotalAmount(subtotal + shippingCost);
  }
}, [shippingCost, subtotal]);

// ✅ TAMBAHKAN INI - Handle return dari payment gateway
useEffect(() => {
  // Cek jika kembali dari payment gateway
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment_status');
  const orderId = urlParams.get('order_id');
  const transactionStatus = urlParams.get('transaction_status');

  console.log('🔄 Checking payment return:', { paymentStatus, orderId, transactionStatus });

  if (paymentStatus || transactionStatus || orderId) {
    // Redirect ke payment callback handler
    navigate(`/payment-callback?${window.location.search}`, { 
      replace: true,
      state: { fromPayment: true }
    });
    return;
  }

  // Cek jika ada data pending order di localStorage
  const pendingOrderStr = localStorage.getItem('pendingOrder');
  if (pendingOrderStr) {
    const pendingOrder = JSON.parse(pendingOrderStr);
    
    // Jika melebihi waktu timeout (30 menit), hapus data
    const storedTime = new Date(pendingOrder.timestamp);
    const currentTime = new Date();
    const diffMinutes = (currentTime.getTime() - storedTime.getTime()) / (1000 * 60);
    
    if (diffMinutes > 30) {
      console.log('🧹 Cleaning expired pending order data');
      localStorage.removeItem('pendingOrder');
    } else {
      console.log('📋 Found pending order:', pendingOrder.orderNumber);
    }
  }
}, [navigate]);


  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    }
  };

  const fetchShippingMethods = async () => {
  try {
    console.log('🔄 Fetching shipping methods...');
    
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('❌ Error fetching shipping methods:', error);
      throw error;
    }
    
    console.log('✅ Shipping methods loaded:', data?.length);
    
    // Pastikan cost berupa number
    const formattedData = data?.map(method => ({
      ...method,
      cost: Number(method.cost) || 0
    })) || [];
    
    setShippingMethods(formattedData);
    
    // Set default shipping method jika ada
    if (formattedData.length > 0 && !selectedShipping) {
      const defaultShipping = formattedData[0];
      setSelectedShipping(defaultShipping.id);
      setShippingCost(defaultShipping.cost);
      console.log('✅ Default shipping method set:', defaultShipping);
    }
    
  } catch (err) {
    console.error('❌ Error in fetchShippingMethods:', err);
    // Tetap set empty array untuk avoid undefined errors
    setShippingMethods([]);
  }
};
  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
      setQrData(generateQRData());
      
      // Set shipping cost dan subtotal dari order
      if (data.shipping_cost) setShippingCost(data.shipping_cost);
      if (data.subtotal) setSubtotal(data.subtotal);
      if (data.shipping_method) setSelectedShipping(data.shipping_method);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      if (trackingPin) {
        const tempOrder = {
          id: orderId || 'temp',
          order_number: orderNumber || 'Loading...',
          tracking_pin: trackingPin,
          total_amount: total || 0,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          customer_name: customerName || 'Customer'
        };
        setOrder(tempOrder);
        setQrData(generateQRData());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShippingMethodSelect = (shippingMethodId: string) => {
  console.log('🚚 Selecting shipping method:', shippingMethodId);
  
  const selectedMethod = shippingMethods.find(method => method.id === shippingMethodId);
  if (selectedMethod) {
    const methodCost = Number(selectedMethod.cost) || 0;
    setSelectedShipping(shippingMethodId);
    setShippingCost(methodCost);
    
    console.log('✅ Shipping method selected:', {
      id: shippingMethodId,
      name: selectedMethod.name,
      cost: methodCost
    });
    
    // Update order jika sudah ada
    if (order) {
      updateOrderShipping(shippingMethodId, methodCost);
    }
  } else {
    console.error('❌ Shipping method not found:', shippingMethodId);
  }
};

  const updateOrderShipping = async (shippingMethodId: string, cost: number) => {
  if (!order) return;

  try {
    console.log('🔄 Updating order shipping:', { shippingMethodId, cost });
    
    const { error } = await supabase
      .from('orders')
      .update({
        shipping_method: shippingMethodId,
        shipping_cost: cost,
        total_amount: subtotal + cost,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (error) {
      console.error('❌ Error updating order shipping:', error);
      throw error;
    }

    console.log('✅ Order shipping updated successfully');

  } catch (error) {
    console.error('Error updating order shipping:', error);
    // Tidak perlu throw error di sini, biarkan user continue
  }
};

  const handlePaymentMethodSelect = async (paymentMethodId: string) => {
  if (!order) return;

  setProcessingPayment(true);
  setSelectedPayment(paymentMethodId);

  try {
    console.log('🔄 Processing payment for order:', order.id);

    // 1. Update order dengan payment method dan shipping
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_method: paymentMethodId,
        shipping_method: selectedShipping,
        shipping_cost: shippingCost,
        subtotal: subtotal,
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) throw updateError;

    // 2. Tampilkan instruksi manual langsung
    console.log('✅ Order updated, showing manual instructions');
    setShowManualInstructions(true);
    
    // 3. Simpan data ke localStorage untuk backup
    localStorage.setItem('pendingOrder', JSON.stringify({
      orderId: order.id,
      orderNumber: order.order_number,
      trackingPin: order.tracking_pin,
      total: totalAmount,
      customerName: order.customer_name,
      paymentMethod: paymentMethodId,
      shippingMethod: selectedShipping,
      shippingCost: shippingCost,
      subtotal: subtotal,
      timestamp: new Date().toISOString()
    }));

  } catch (error: any) {
    console.error('❌ Payment processing error:', error);
    
    let errorMessage = 'Gagal memproses pembayaran';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    alert(`❌ ${errorMessage}`);
    setShowManualInstructions(true);
    setSelectedPayment('');
  } finally {
    setProcessingPayment(false);
  }
};

  const handleConfirmAndGoToInvoice = async () => {
  if (!order) return;

  setConfirmingPayment(true);
  try {
    console.log('🔄 Starting payment confirmation for order:', order.id);

    // Validasi data yang diperlukan
    if (!selectedShipping) {
      throw new Error('Metode pengiriman belum dipilih');
    }

    // Dapatkan payment method ID yang valid
    let paymentMethodId = selectedPayment;
    let paymentMethodName = 'Manual Confirmation';

    // Jika tidak ada payment method yang dipilih, gunakan default
    if (!paymentMethodId) {
      const defaultPaymentMethod = paymentMethods.find(m => m.code === 'bank-transfer') || paymentMethods[0];
      if (defaultPaymentMethod) {
        paymentMethodId = defaultPaymentMethod.id;
        paymentMethodName = defaultPaymentMethod.name;
      }
    } else {
      // Jika ada payment method yang dipilih, dapatkan namanya
      const selectedMethod = paymentMethods.find(m => m.id === paymentMethodId);
      if (selectedMethod) {
        paymentMethodName = selectedMethod.name;
      }
    }

    console.log('📦 Update data:', {
      orderId: order.id,
      paymentMethodId,
      paymentMethodName,
      shippingMethodId: selectedShipping,
      shippingCost,
      subtotal,
      totalAmount
    });

    // Update status order ke 'paid' di database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        payment_method: paymentMethodId, // Pastikan ini UUID valid
        shipping_method: selectedShipping, // Pastikan ini UUID valid
        shipping_cost: shippingCost,
        subtotal: subtotal,
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw updateError;
    }

    console.log('✅ Payment confirmed successfully');

    // Dapatkan data customer yang lengkap dari database
    const { data: orderDetails, error: orderDetailsError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', order.id)
      .single();

    if (orderDetailsError) {
      console.error('Error fetching order details:', orderDetailsError);
    }

    // Siapkan data untuk invoice
    const invoiceData = {
      orderId: order.id,
      orderNumber: order.order_number,
      trackingPin: order.tracking_pin,
      total: totalAmount,
      status: 'confirmed',
      paymentMethod: paymentMethodId,
      paymentMethodName: paymentMethodName,
      shippingMethod: selectedShipping,
      shippingCost: shippingCost,
      subtotal: subtotal,
      createdAt: new Date().toISOString(),
      customer: orderDetails ? {
        nama: orderDetails.customer_name || 'Customer',
        email: orderDetails.customer_email || 'customer@example.com',
        telepon: orderDetails.customer_phone || '08123456789',
        alamat: orderDetails.customer_address || 'Alamat lengkap customer',
        kota: orderDetails.customer_city || 'Kota',
        provinsi: orderDetails.customer_province || 'Provinsi',
        kodePos: orderDetails.customer_postal_code || '12345'
      } : {
        nama: order.customer_name || 'Customer',
        email: 'customer@example.com',
        telepon: '08123456789',
        alamat: 'Alamat lengkap customer',
        kota: 'Kota',
        provinsi: 'Provinsi',
        kodePos: '12345'
      }
    };

    console.log('📄 Navigating to invoice with data:', invoiceData);

    // Navigasi ke halaman invoice
    navigate('/invoice', { 
      state: { 
        orderData: invoiceData 
      } 
    });

  } catch (error: any) {
    console.error('❌ Error confirming payment:', error);
    
    let errorMessage = 'Gagal mengkonfirmasi pembayaran. Silakan coba lagi.';
    
    if (error.message?.includes('invalid input syntax for type uuid')) {
      errorMessage = 'Error: Format data tidak valid. Silakan refresh halaman dan coba lagi.';
    } else if (error.message?.includes('Metode pengiriman belum dipilih')) {
      errorMessage = 'Silakan pilih metode pengiriman terlebih dahulu.';
    }
    
    alert(errorMessage);
  } finally {
    setConfirmingPayment(false);
  }
};;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatPrice = (price: number) => {
    const validPrice = Number(price) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(validPrice);
  };

  // Fungsi untuk download QR Code
  const downloadQRCode = () => {
    const canvas = document.getElementById("qris-qrcode") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `qris-buysini-${order?.order_number}.png`;
      link.click();
    }
  };

  // Get payment method icon berdasarkan code
  const getPaymentMethodIcon = (methodCode: string) => {
    const icons: { [key: string]: any } = {
      qris: QrCode,
      gopay: Smartphone,
      ovo: Smartphone,
      dana: Smartphone,
      shopeepay: Smartphone,
      linkaja: Smartphone,
      bank_transfer: Building,
      cstore: Store,
      credit_card: CreditCard
    };
    return icons[methodCode] || CreditCard;
  };

  const getPaymentMethodColor = (methodCode: string) => {
    const colors: { [key: string]: string } = {
      qris: 'bg-purple-500',
      gopay: 'bg-green-500',
      ovo: 'bg-purple-600',
      dana: 'bg-blue-500',
      shopeepay: 'bg-orange-500',
      linkaja: 'bg-green-600',
      bank_transfer: 'bg-blue-500',
      cstore: 'bg-red-500',
      credit_card: 'bg-indigo-500'
    };
    return colors[methodCode] || 'bg-gray-500';
  };

  // Get shipping method icon
  const getShippingMethodIcon = (methodCode: string) => {
    const icons: { [key: string]: any } = {
      jne: Truck,
      tiki: Truck,
      pos: Truck,
      jnt: Truck,
      sicepat: Truck,
      anteraja: Truck,
      grab: Truck,
      gojek: Truck
    };
    return icons[methodCode] || Package;
  };

  const getShippingMethodColor = (methodCode: string) => {
    const colors: { [key: string]: string } = {
      jne: 'bg-red-500',
      tiki: 'bg-green-500',
      pos: 'bg-blue-500',
      jnt: 'bg-orange-500',
      sicepat: 'bg-yellow-500',
      anteraja: 'bg-purple-500',
      grab: 'bg-green-600',
      gojek: 'bg-green-400'
    };
    return colors[methodCode] || 'bg-gray-500';
  };

  const getSupportedApps = () => {
    const uniqueMethods = paymentMethods.filter(method => 
      ['gopay', 'ovo', 'dana', 'cstore'].includes(method.code.toLowerCase())
    );
    
    // Hapus duplikat berdasarkan code
    return uniqueMethods.filter((method, index, self) => 
      index === self.findIndex(m => m.code === method.code)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat detail pesanan...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Data Pesanan Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-8">Silakan lacak pesanan menggunakan PIN tracking.</p>
            <button
              onClick={() => navigate('/track-order')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lacak Pesanan
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-yellow-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Menunggu Pembayaran
            </h1>
            
            <p className="text-gray-600 mb-2">
              Silakan pilih metode pengiriman, pembayaran dan selesaikan dalam waktu 24 jam.
            </p>
            <p className="text-sm text-gray-500">
              No. Pesanan: <span className="font-semibold">{order?.order_number}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Info & Methods */}
            <div className="lg:col-span-2 space-y-6">
              {/* PIN Tracking */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    PIN Tracking Pesanan
                  </h2>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-600 mb-2 text-center">
                    Simpan PIN ini untuk melacak pesanan:
                  </p>
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-blue-300">
                    <code className="text-2xl font-bold text-blue-700 tracking-wider font-mono">
                      {order?.tracking_pin}
                    </code>
                    <button
                      onClick={() => copyToClipboard(order?.tracking_pin || '')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copied ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="text-left">
                    <p className="font-medium">Subtotal</p>
                    <p className="font-semibold text-gray-800">
                      {formatPrice(subtotal || order?.total_amount || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Ongkir</p>
                    <p className="font-semibold text-gray-800">
                      {formatPrice(shippingCost)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Total</p>
                    <p className="font-semibold text-blue-600 text-lg">
                      {formatPrice(totalAmount || order?.total_amount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Methods */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Pilih Metode Pengiriman
                </h2>

                <div className="space-y-4">
                  {shippingMethods.length > 0 ? (
                    shippingMethods.map((method) => {
                      const Icon = getShippingMethodIcon(method.code);
                      const methodCost = Number(method.cost) || 0;
                      
                      return (
                        <button
                          key={method.id}
                          onClick={() => handleShippingMethodSelect(method.id)}
                          className={`w-full text-left p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                            selectedShipping === method.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-3">
                                {method.logo_url ? (
                                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
                                    <img
                                      src={method.logo_url}
                                      alt={method.name}
                                      className="w-10 h-10 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    <div className={`w-10 h-10 ${getShippingMethodColor(method.code)} rounded-lg flex items-center justify-center hidden`}>
                                      <Icon className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`w-12 h-12 ${getShippingMethodColor(method.code)} rounded-lg flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-gray-800">
                                    {method.name}
                                  </h3>
                                  <span className="text-lg font-bold text-blue-600">
                                    {formatPrice(methodCost)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {method.estimated_days || 'Estimasi 2-5 hari kerja'}
                                </p>
                              </div>
                            </div>
                            
                            <div className={`w-6 h-6 rounded-full border-2 ${
                              selectedShipping === method.id 
                                ? 'bg-blue-600 border-blue-600' 
                                : 'border-gray-300'
                            }`}></div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Memuat metode pengiriman...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods dari Database */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">
                  Pilih Metode Pembayaran
                </h2>

                <div className="space-y-4">
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => {
                      const Icon = getPaymentMethodIcon(method.code);
                      return (
                        <button
                          key={method.id}
                          onClick={() => handlePaymentMethodSelect(method.id)}
                          disabled={processingPayment || !selectedShipping}
                          className={`w-full text-left p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                            selectedPayment === method.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${processingPayment || !selectedShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-3">
                                {method.logo_url ? (
                                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
                                    <img
                                      src={method.logo_url}
                                      alt={method.name}
                                      className="w-10 h-10 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    <div className={`w-10 h-10 ${getPaymentMethodColor(method.code)} rounded-lg flex items-center justify-center hidden`}>
                                      <Icon className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`w-12 h-12 ${getPaymentMethodColor(method.code)} rounded-lg flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-800">
                                    {method.name}
                                  </h3>
                                  {(method.code === 'qris' || method.code === 'gopay') && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                      Populer
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {method.instructions || 
                                    (method.code === 'qris' && 'Scan QR code dengan aplikasi e-wallet atau mobile banking') ||
                                    (method.code === 'gopay' && 'Bayar dengan GoPay - proses instan') ||
                                    (method.code === 'bank_transfer' && 'Transfer manual via BCA, BNI, BRI, Mandiri, dll') ||
                                    (method.code === 'cstore' && 'Bayar di gerai Indomaret atau Alfamart terdekat') ||
                                    (method.code === 'credit_card' && 'Visa, Mastercard, JCB') ||
                                    'Pembayaran melalui ' + method.name
                                  }
                                </p>
                              </div>
                            </div>
                            
                            {selectedPayment === method.id && processingPayment ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            ) : (
                              <div className={`w-6 h-6 rounded-full border-2 ${
                                selectedPayment === method.id 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300'
                              }`}></div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Memuat metode pembayaran...</p>
                    </div>
                  )}
                </div>

                {!selectedShipping && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-700 text-sm text-center">
                      Silakan pilih metode pengiriman terlebih dahulu
                    </p>
                  </div>
                )}

                {/* Manual Payment Instructions Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowManualInstructions(true)}
                    className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Ada Masalah dengan Pembayaran? Klik di sini untuk Instruksi Manual
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Jika mengalami masalah dengan halaman pembayaran, gunakan instruksi manual di atas
                  </p>
                </div>

                {processingPayment && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm text-center">
                      Mengarahkan ke halaman pembayaran {selectedPayment.toUpperCase()}...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Information */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Ringkasan Pesanan</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal || (order?.total_amount || 0) - shippingCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkos Kirim:</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {formatPrice((subtotal || (order?.total_amount || 0) - shippingCost) + shippingCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-yellow-800 font-semibold mb-3">
                      Instruksi Pembayaran:
                    </p>
                    <ul className="text-yellow-700 text-sm space-y-2">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Pilih metode pengiriman dan pembayaran</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Anda akan diarahkan ke halaman pembayaran</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Selesaikan pembayaran dalam 24 jam</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Status akan update otomatis setelah pembayaran</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/track-order')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <CheckSquare className="w-5 h-5" />
                    Lacak Pesanan
                  </button>
                  
                  <button
                    onClick={() => navigate('/products')}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Lanjutkan Belanja
                  </button>

                  {/* Tombol Konfirmasi Sudah Bayar */}
                  <button
                    onClick={handleConfirmAndGoToInvoice}
                    disabled={confirmingPayment || !selectedShipping}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {confirmingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Konfirmasi Sudah Bayar
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Klik "Konfirmasi Sudah Bayar" jika Anda sudah melakukan pembayaran
                </p>
              </div>

              {/* Support Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Butuh Bantuan?</h4>
                <div className="text-blue-700 text-sm space-y-1">
                  <p>📞 +62 878-1889-4504</p>
                  <p>✉️ info@buysini.com</p>
                  <p className="text-xs mt-2">Senin - Minggu, 08:00 - 17:00 WIB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Instructions Modal */}
      {showManualInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Instruksi Pembayaran Manual</h3>
                <button
                  onClick={() => setShowManualInstructions(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* QRIS Manual */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-600" />
                  QRIS Manual
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Scan QR Code berikut:</p>
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                      <div className="w-48 h-48 bg-white mx-auto border border-gray-300 rounded-lg flex items-center justify-center p-2">
                        {qrData ? (
                          <QRCodeCanvas
                            id="qris-qrcode"
                            value={qrData}
                            size={160}
                            level="H"
                            includeMargin={true}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">Memuat QR Code...</span>
                        )}
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-600 font-mono bg-white p-2 rounded border">
                          Order: {order?.order_number}
                        </p>
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          {formatPrice(totalAmount || order?.total_amount || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm font-semibold">Cara Bayar:</p>
                      <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                        <li>1. Buka aplikasi e-wallet/mobile banking</li>
                        <li>2. Pilih fitur Scan QRIS</li>
                        <li>3. Scan QR code di samping</li>
                        <li>4. Konfirmasi pembayaran</li>
                        <li>5. Simpan bukti pembayaran</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 text-sm font-semibold mb-3">Supported Apps:</p>
                      <div className="flex flex-wrap gap-3 justify-center">
                        {getSupportedApps().map((method) => (
                          <div key={method.id} className="flex flex-col items-center">
                            {method.logo_url ? (
                              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden p-1">
                                <img
                                  src={method.logo_url}
                                  alt={method.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className={`w-12 h-12 ${getPaymentMethodColor(method.code)} rounded-lg flex items-center justify-center`}>
                                <span className="text-white text-xs font-bold">
                                  {method.name.substring(0, 1)}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        const message = `Halo, saya ingin melakukan pembayaran untuk Order ${order?.order_number} sebesar ${formatPrice(totalAmount || order?.total_amount || 0)}. Mohon informasi pembayaran QRIS-nya.`;
                        window.open(`https://wa.me/6287818894504?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.165-3.495-8.411"/>
                      </svg>
                      Minta QR Code via WhatsApp
                    </button>
                    
                    <button
                      onClick={downloadQRCode}
                      className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download QR Code
                    </button>
                  </div>
                </div>
              </div>

              {/* Transfer Bank */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Transfer Bank Manual
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Bank</p>
                      <p className="font-semibold">BCA</p>
                    </div>
                    <div>
                      <p className="text-gray-600">No. Rekening</p>
                      <p className="font-semibold">342-068-3323</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Atas Nama</p>
                      <p className="font-semibold">Ricky Steven Silaban</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Transfer</p>
                      <p className="font-semibold text-blue-600">{formatPrice(totalAmount || order?.total_amount || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm font-semibold">Instruksi:</p>
                    <ul className="text-blue-700 text-sm mt-2 space-y-1">
                      <li>• Transfer tepat sesuai jumlah: <strong>{formatPrice(totalAmount || order?.total_amount || 0)}</strong></li>
                      <li>• Tambahkan keterangan: <strong>Order {order?.order_number}</strong></li>
                      <li>• Setelah transfer, kirim bukti ke WhatsApp</li>
                      <li>• Pesanan akan diproses dalam 1-2 jam</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => {
                      const message = `Halo, saya sudah transfer untuk Order ${order?.order_number} sebesar ${formatPrice(totalAmount || order?.total_amount || 0)}. Berikut bukti transfernya:`;
                      window.open(`https://wa.me/6287818894504?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Kirim Bukti Transfer via WhatsApp
                  </button>
                </div>
              </div>

              {/* Indomaret/Alfamart */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5 text-red-600" />
                  Bayar di Indomaret / Alfamart
                </h4>
                <div className="space-y-3">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm font-mono text-center text-gray-800">
                      Kode Pembayaran: <strong>88{order?.tracking_pin}</strong>
                    </p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm font-semibold">Cara Bayar:</p>
                    <ol className="text-red-700 text-sm mt-2 space-y-1 list-decimal list-inside">
                      <li>Tunjukan kode <strong>88{order?.tracking_pin}</strong> ke kasir</li>
                      <li>Bayar tepat <strong>{formatPrice(totalAmount || order?.total_amount || 0)}</strong></li>
                      <li>Simpan struk sebagai bukti</li>
                      <li>Pesanan akan otomatis diproses</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowManualInstructions(false)}
                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Tutup Instruksi
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default OrderPending;
