import "./globals.css";
import AuthProvider from "../components/AuthProvider";
import LayoutContent from "../components/LayoutContent";

export const metadata = {
  title: "Inventory Management — Dashboard",
  description: "Inventory, listings, and sales management dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
