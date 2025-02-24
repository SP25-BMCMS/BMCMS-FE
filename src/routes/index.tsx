import { BrowserRouter as Router, Routes, Route } from "react-router-dom";



import Login from "@/pages/auth/login";
import DashboardLayout from "@/layouts/DashboardLayout";  

function AppRoutes() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/" element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          <Route path="/customer" element={<div>Customer Content</div>} />
          <Route path="/staff" element={<div>Staff Content</div>} />
          <Route path="/tasks" element={<div>Tasks Content</div>} />
          <Route path="/pictures" element={<div>Pictures Content</div>} />
          <Route path="/worklog" element={<div>WorkLog Content</div>} />
        </Route>
        </Routes>
    </Router>
  );
}

export default AppRoutes;
