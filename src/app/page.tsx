'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra xem đã đăng nhập chưa
  useEffect(() => {
    // Bọc vào hàm async để tránh lỗi Cascading Renders
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Che màn hình lúc đang kiểm tra token để tránh nháy giao diện
  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center items-center p-6 text-black">
      <div className="max-w-4xl text-center space-y-8 bg-white p-12 rounded-3xl shadow-xl border border-indigo-50">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="TOTAL Logo" className="h-20 object-contain" />
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Tối ưu hóa quy trình <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Daily Standup Meeting
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          Nền tảng quản lý báo cáo công việc hàng ngày, tự động hóa việc theo dõi tiến độ và tích hợp AI tổng kết báo cáo tuần bởi Total Education Việt Nam.
        </p>

        <div className="pt-8">
          <Link
            href="/login"
            className="inline-block px-10 py-4 bg-blue-600 text-white font-bold text-lg rounded-full hover:bg-blue-700 shadow-xl shadow-blue-200 transition-transform hover:-translate-y-1"
          >
            Đăng nhập để bắt đầu
          </Link>
        </div>
      </div>
    </div>
  );
}