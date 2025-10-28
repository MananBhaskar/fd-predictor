import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import FDTrendPredictor from "./components/FDTrendPredictor.jsx";
import Login from "./components/Login.jsx";
import Signup from "./components/Signup.jsx";
import Navbar from "./components/Navbar.js";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/fdtrendpredictor" element={token ? <FDTrendPredictor /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}
