import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";
import Sidebar from "../components/Sidebar/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Inventory Management — Dashboard",
  description: "Inventory, listings, and sales management dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ margin: 0, padding: 0, height: "100vh", overflow: "hidden" }}>
        <AuthProvider>
          <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
            <Sidebar />
            <main style={{ flex: 1, height: "100vh", overflowY: "auto", overflowX: "hidden", background: "var(--background)" }}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
