'use client';

import React, { useEffect, useState } from 'react';

export default function Footer() {
    const [standupCount, setStandupCount] = useState(0);

    // Tự động gọi API lấy số lượng khi Footer được render
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:8000/notes/stats/monthly-public');
                if (res.ok) {
                    const data = await res.json();
                    setStandupCount(data.current_month_count);
                }
            } catch (error) {
                console.error('Lỗi lấy thống kê footer', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <footer className="bg-white border-t border-gray-200 py-8 mt-auto w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-0">

                    {/* CỘT TRÁI: Logo & Copyright */}
                    <div className="flex flex-col items-center md:items-start space-y-3">
                        <div className="flex items-center space-x-2">
                            <img src="/logo.png" alt="TOTAL Logo" className="h-8 object-contain" />
                            <span className="font-extrabold text-gray-900 text-lg tracking-tight">TOTAL Education Workspace</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                            © 2026 TOTAL Education. All rights reserved.
                        </p>
                    </div>

                    {/* CỘT GIỮA: Thống kê & Động lực */}
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 shadow-sm transition-transform hover:scale-105 cursor-default">
                            <p className="text-sm font-semibold text-gray-700">
                                Tháng này đã có <span className="text-blue-600 font-extrabold text-base mx-1">{standupCount}</span> bản ghi Standup được nộp!
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 italic max-w-md px-4">
                            &quot;Tiến bộ 1% mỗi ngày. Đừng so sánh mình với ai khác, hãy tốt hơn chính bạn của ngày hôm qua.&quot;
                        </p>
                    </div>

                    {/* CỘT PHẢI: Tác giả & Trạng thái hệ thống */}
                    <div className="flex flex-col items-center md:items-end space-y-3">
                        <div className="flex items-center px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-default">
                            <span className="mr-2 text-base">✨</span>
                            <span className="text-sm font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
                                Code by Pea Duong - Total Education
                            </span>
                        </div>

                        <div className="flex items-center space-x-2.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold text-gray-600 tracking-wide uppercase">System: Online</span>
                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
}