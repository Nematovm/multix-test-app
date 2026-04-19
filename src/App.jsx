import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TestPage from './pages/TestPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/test/:testId" element={<TestPage />} />
        <Route path="/listening/:testId" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  );
}