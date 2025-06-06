import React from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/TestingEngineerLogo.svg";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <img src={Logo} alt="SDET Hub Logo" className="w-32 h-32 mb-6" />
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">SDET Hub</h1>
      <p className="text-lg md:text-xl text-gray-300 mb-10 text-center max-w-md">Transforming anyone into a job-ready SDET professional</p>
      <div className="flex gap-4">
        <Link to="/login" className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-md shadow-lg hover:from-orange-600 hover:to-red-600 transition duration-300 ease-in-out">Login</Link>
        <Link to="/register" className="px-8 py-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-md shadow-lg hover:bg-gray-100 transition duration-300 ease-in-out">Register</Link>
      </div>
    </div>
  );
} 