import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../integrations/supabase/client.ts";

import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  is_active: boolean;
  product_count?: number;
}

const Kategori: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    setupRealtimeSubscription();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          products:products(count)
        `)
        .eq('is_active', true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map((category: any) => ({
        ...category,
        product_count: category.products?.length || 0
      }));

      setCategories(transformedData);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('categories-public')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        (payload) => {
          console.log('Categories update:', payload);
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const handleCategoryClick = (slug: string) => {
    navigate(`/products?category=${slug}`);
  };

  if (loading) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="h-20 w-20 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Kategori Produk</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan berbagai macam produk berkualitas dalam kategori yang lengkap
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Belum ada kategori produk</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.slug)}
                className="border rounded-lg p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 bg-white"
              >
                <div className="mb-4 h-20 w-20 flex items-center justify-center text-4xl rounded-lg bg-gray-100 overflow-hidden">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/80x80/e5e7eb/9ca3af?text=📦';
                      }}
                    />
                  ) : (
                    <span className="text-3xl">{category.icon || "📦"}</span>
                  )}
                </div>
                <h2 className="font-bold text-lg text-gray-800 mb-2">{category.name}</h2>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                )}
                <p className="text-xs text-blue-600 font-medium">
                  {category.product_count || 0} produk tersedia
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Kategori;
