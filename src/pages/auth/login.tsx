import React, { useState } from "react";

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-white">
      <div className="flex max-w-4xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="w-1/2 p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">LOGIN</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700">
                <span className="flex items-center">
                  <i className="fas fa-envelope mr-2"></i>
                  Email
                </span>
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Email@Example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

        <div className="w-1/2 flex items-center justify-center bg-blue-50">
          <img
            src="/login-illustration.png"
            alt="Login Illustration"
            className="max-w-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
