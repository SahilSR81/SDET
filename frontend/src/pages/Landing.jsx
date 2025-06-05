import React from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/TestingEngineerLogo.svg";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <img src={Logo} alt="SDET Hub Logo" className="w-24 h-24 mb-6" />
      <h1 className="text-4xl font-bold text-blue-900 mb-2">SDET Hub</h1>
      <p className="text-lg text-blue-700 mb-8">Transforming anyone into a job-ready SDET professional</p>
      <div className="flex gap-4">
        <Link to="/login" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Login</Link>
        <Link to="/register" className="px-6 py-2 bg-white border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition">Register</Link>
      </div>
    </div>
  );
} 