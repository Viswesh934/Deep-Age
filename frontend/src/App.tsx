import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { TestDriveProvider } from '@/context/TestDriveContext';

export default function App() {
  return (
    <TestDriveProvider>
      <RouterProvider router={router} />
    </TestDriveProvider>
  );
}
