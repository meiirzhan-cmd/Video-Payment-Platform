import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/shared/components/Layout';
import GuestRoute from '@/auth/components/GuestRoute';
import ProtectedRoute from '@/auth/components/ProtectedRoute';
import CreatorRoute from '@/auth/components/CreatorRoute';
import CatalogPage from '@/videos/CatalogPage';
import VideoDetailPage from '@/videos/VideoDetailPage';
import LoginPage from '@/auth/LoginPage';
import RegisterPage from '@/auth/RegisterPage';
import PurchasesPage from '@/user/PurchasesPage';
import CheckoutSuccessPage from '@/payment/CheckoutSuccessPage';
import CheckoutCancelPage from '@/payment/CheckoutCancelPage';
import DashboardPage from '@/creator/DashboardPage';
import UploadPage from '@/creator/UploadPage';
import EditVideoPage from '@/creator/EditVideoPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // Public
      { path: '/', element: <CatalogPage /> },
      { path: '/videos/:id', element: <VideoDetailPage /> },

      // Guest only
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },

      // Authenticated
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/purchases', element: <PurchasesPage /> },
          { path: '/checkout/success', element: <CheckoutSuccessPage /> },
          { path: '/checkout/cancel', element: <CheckoutCancelPage /> },
        ],
      },

      // Creator
      {
        element: <CreatorRoute />,
        children: [
          { path: '/creator/dashboard', element: <DashboardPage /> },
          { path: '/creator/upload', element: <UploadPage /> },
          { path: '/creator/videos/:id/edit', element: <EditVideoPage /> },
        ],
      },
    ],
  },
]);
