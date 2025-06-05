import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Curriculum from "./pages/Curriculum";
import ModuleDetail from "./pages/ModuleDetail";
import Quiz from "./pages/Quiz";
import QuizSetup from "./pages/QuizSetup";
import QuizStart from "./pages/QuizStart";
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/module/:idx" element={<ModuleDetail />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/setup" element={<QuizSetup />} />
        <Route path="/quiz/start" element={<QuizStart />} />
      </Routes>
    </Router>
  );
}

export default App;
