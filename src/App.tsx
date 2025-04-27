import React from 'react';
import AppRoutes from '@/routes';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { HashRouter } from 'react-router-dom';
import { RiSunLine, RiMoonLine } from 'react-icons/ri';

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const Header = () => {
    return (
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">{/* ... existing code ... */}</div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDarkMode ? (
                  <RiSunLine className="w-5 h-5 text-yellow-500" />
                ) : (
                  <RiMoonLine className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  };

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
