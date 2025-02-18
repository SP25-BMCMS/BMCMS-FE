import { BrowserRouter as Router, Routes, Route } from "react-router-dom";



import Login from "@/pages/auth/login";
// import Dashboard from "@/pages/home/dashboard";  

function AppRoutes() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        </Routes>
    </Router>
  );
}

export default AppRoutes;
