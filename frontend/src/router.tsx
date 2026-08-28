import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
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
        element: <Navigate to="/explore" replace />,
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
        element: <Navigate to="/explore" replace />,
      },
    ],
  },
]);
