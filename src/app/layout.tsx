import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer"; // Import component Footer vừa tạo

// Tải font Inter với các ký tự tiếng Việt
const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "TOTAL DSM WebApp",
  description: "Nền tảng Daily Standup Meeting từ TOTAL",
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      {/* Thêm flex-col và min-h-screen để cấu trúc trang ép Footer xuống đáy */}
      <body className={`${inter.className} min-h-screen flex flex-col`}>

        {/* Phần nội dung chính (Landing Page, Login, Dashboard...) sẽ chiếm không gian ở giữa */}
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        {/* Chân trang sẽ luôn xuất hiện ở cuối mọi màn hình */}
        <Footer />

      </body>
    </html>
  );
}