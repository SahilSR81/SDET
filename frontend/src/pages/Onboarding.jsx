import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, doc, setDoc } from "../firebase";

export default function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name,
        goals,
        avatar: user.photoURL || "",
        onboardingComplete: true,
      }, { merge: true });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md flex flex-col items-center">
        <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">Welcome to SDET Hub!</h2>
        <p className="mb-6 text-lg text-indigo-100 font-medium text-center">Let's get you started. Complete your profile to begin learning.</p>
        {error && <div className="mb-4 text-red-400 font-semibold">{error}</div>}
        <input
          type="text"
          placeholder="Full Name"
          className="w-full mb-4 px-4 py-3 rounded-xl border-none bg-white/80 text-lg font-semibold focus:ring-2 focus:ring-indigo-400 transition"
          value={name} 
          onChange={e => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Your learning goals (optional)"
          className="w-full mb-4 px-4 py-3 rounded-xl border-none bg-white/80 text-lg font-medium focus:ring-2 focus:ring-indigo-400 transition"
          value={goals}
          onChange={e => setGoals(e.target.value)} 
        />
        <button type="submit" className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-xl font-bold shadow-lg hover:scale-105 transition-transform duration-200" disabled={loading}>
          {loading ? "Saving..." : "Complete Onboarding"}
        </button>
      </form>
    </div>
  );
}