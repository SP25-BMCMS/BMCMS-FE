import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../auth/login.css';
import loginImage from "../../image/login-screen.png"
import authApi from "@/services/auth";


const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await authApi.signIn(username, password);
      
      // Lưu token vào localStorage
      localStorage.setItem('bmcms_token', response.accessToken);
      localStorage.setItem('bmcms_refresh_token', response.refreshToken);

      // Chuyển hướng đến trang dashboard
      navigate('/dashboard');
    } catch (error) {
      setError("Invalid email or password");
    }
  };


  return (
    <div className="min-h-screen flex items-center animation-bg justify-center bg-gradient-to-r from-[#94EBFF] via-[#D3F5FF] to-white">
      <div className="flex max-w-4xl w-full">
        {/* Phần Login Box */}
        <div className="w-1/2 h-[500px] p-8 bg-white shadow-lg rounded-lg border-4 border-[#0AEEFE]">
          <h2 className="text-3xl font-bold mb-6 text-center">LOGIN</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700">
                <span className="flex items-center">
                  <i className="fas fa-envelope mr-2"></i>
                  Username
                </span>
              </label>
              <input
                type="username"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="John_Doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700">
                <span className="flex items-center">
                  <i className="fas fa-lock mr-2"></i>
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="****************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-4 flex items-center">
                  <i className="fas fa-eye"></i>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" />
                Remember Password
              </label>
              <a href="#" className="text-blue-500 text-sm">
                Forgot Password
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg text-lg hover:bg-gray-800"
            >
              LOGIN
            </button>
          </form>
        </div>

        {/* Phần hình ảnh */}
        <div className="w-1/2 flex items-center justify-center">
          <img
            src={loginImage}
            alt="Login Illustration"
            className="max-w-xs transform scale-x-[-1]"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
