import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TestPage from './pages/TestPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/test/:id" element={<TestPage />} />
        <Route path="/listening/:id" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  );
}