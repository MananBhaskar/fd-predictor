import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-blue-500 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Left side - logo or title */}
        <Link
          to="/signup"
          className="text-2xl font-bold tracking-wide text-white hover:text-indigo-200 transition"
        >
          FD Predictor
        </Link>

        {/* Right side - navigation links */}
        <div className="flex items-center space-x-6">
          {token ? (
            <>
              <Link
                to="/fdtrendpredictor"
                className="text-white hover:text-indigo-200 transition font-medium"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg font-medium shadow-sm transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-white hover:text-indigo-200 font-medium transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-white text-indigo-600 hover:bg-indigo-100 font-medium px-4 py-1.5 rounded-lg shadow-sm transition"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
