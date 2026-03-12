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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <div style={{ display: "flex", flex: 1, width: "100%" }}>
            <Sidebar />
            <main style={{ flex: 1, overflowX: "hidden", minHeight: "100vh" }}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
