import React, { useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getUpdatedXpAndBadges } from "../utils/gamification";

export default function Quiz() {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleQuizComplete = async () => {
    setLoading(true);
    const user = auth.currentUser; // Assuming user is logged in for demo
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};
    const quizzes = data.quizzes || [];
    const newQuizzes = [...quizzes, { date: new Date().toISOString() }];
    const xpBadges = getUpdatedXpAndBadges({ action: "quiz", userData: { ...data, quizzes: newQuizzes } });
    await updateDoc(userRef, { quizzes: newQuizzes, xp: xpBadges.xp, badges: xpBadges.badges });
    setResult({ xp: xpBadges.xp, badges: xpBadges.badges });
    setCompleted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-gray-100 p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 animate-fade-in">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-indigo-400 drop-shadow-md">Quiz (Demo)</h1>
        {!completed ? (
          <div className="flex flex-col items-center space-y-6">
            {/* Placeholder for Question */}
            <div className="w-full">
              <p className="text-lg font-semibold mb-4">Placeholder Question Text Goes Here?</p>
              {/* Placeholder for Answer Options */}
              <div className="space-y-3">
                <div className="flex items-center bg-gray-700 p-3 rounded-md cursor-pointer hover:bg-gray-600 transition">
                  <input type="radio" id="option1" name="answer" value="option1" className="mr-3 accent-indigo-500" />
                  <label htmlFor="option1">Option 1</label>
                </div>
                <div className="flex items-center bg-gray-700 p-3 rounded-md cursor-pointer hover:bg-gray-600 transition">
                  <input type="radio" id="option2" name="answer" value="option2" className="mr-3 accent-indigo-500" />
                  <label htmlFor="option2">Option 2</label>
                </div>
                {/* Add more options as needed */}
              </div>
            </div>
            <button
              onClick={handleQuizComplete}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-xl font-bold shadow-lg hover:scale-105 transition-transform duration-200"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Complete Quiz"}
            </button>
          </div>
        ) : (
          <div className="text-center text-green-400 font-semibold text-lg">Quiz completed! XP Earned: {result.xp}, Badges: {result.badges.join(", ")}</div>
        )}
      </div>
    </div>
  );
}