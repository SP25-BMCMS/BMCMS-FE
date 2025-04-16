import React from 'react';
import AppRoutes from '@/routes';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { HashRouter } from 'react-router-dom';

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
          <Toaster position="top-right" reverseOrder={false} />
          <AppRoutes />
        </div>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
