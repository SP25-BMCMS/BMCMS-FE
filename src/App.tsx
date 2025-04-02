import AppRoutes from "@/routes";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
        <Toaster position="top-right" reverseOrder={false} />
        <AppRoutes />
      </div>
    </ThemeProvider>
  );
}

export default App;
