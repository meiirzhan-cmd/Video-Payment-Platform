import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, PlayCircle, Upload, LayoutDashboard, ShoppingBag, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/auth/auth-store';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isCreator = user?.role === 'CREATOR' || user?.role === 'ADMIN';
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <>
      {user ? (
        <>
          {isCreator && (
            <>
              <Link
                to="/creator/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/creator/upload"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Link>
            </>
          )}
          <Link
            to="/purchases"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
          >
            <ShoppingBag className="h-4 w-4" />
            Purchases
          </Link>
          <span className="text-sm text-gray-500">{user.email}</span>
          <button
            onClick={() => {
              logout();
              setMobileOpen(false);
            }}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-gray-600 hover:text-primary"
          >
            Login
          </Link>
          <Link
            to="/register"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Register
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <PlayCircle className="h-6 w-6" />
          LearnStream
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">{navLinks}</div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-600 md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="flex flex-col gap-4 border-t px-4 py-4 md:hidden">{navLinks}</div>
      )}
    </nav>
  );
}
