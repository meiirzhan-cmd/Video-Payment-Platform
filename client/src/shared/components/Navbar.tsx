import { Link } from 'react-router-dom';
import { LogOut, PlayCircle, Upload, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/auth/auth-store';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isCreator = user?.role === 'CREATOR' || user?.role === 'ADMIN';

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <PlayCircle className="h-6 w-6" />
          LearnStream
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isCreator && (
                <>
                  <Link
                    to="/creator/dashboard"
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/creator/upload"
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Link>
                </>
              )}
              <Link
                to="/purchases"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
              >
                <ShoppingBag className="h-4 w-4" />
                Purchases
              </Link>
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-danger"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
