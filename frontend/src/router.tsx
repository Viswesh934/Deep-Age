import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { LandingPage } from '@/pages/LandingPage';
import { ExplorePage } from '@/pages/ExplorePage';
import { DebugPage } from '@/pages/DebugPage';
import { InspectPage } from '@/pages/InspectPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'debug',
        element: <DebugPage />,
      },
      {
        path: 'inspect',
        element: <InspectPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
