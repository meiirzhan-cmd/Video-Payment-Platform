import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ToastContainer from './ToastContainer';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <ToastContainer />
    </div>
  );
}
