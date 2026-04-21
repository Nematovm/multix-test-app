import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import TestPage from './pages/TestPage';

const router = createBrowserRouter([
  { path: '/test/:id',      element: <TestPage /> },
  { path: '/listening/:id', element: <TestPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}