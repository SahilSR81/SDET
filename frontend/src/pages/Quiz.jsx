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
    const user = auth.currentUser;
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
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Quiz (Demo)</h1>
      {!completed ? (
        <>
          <p className="mb-4">Take a quiz to earn XP and badges!</p>
          <button
            onClick={handleQuizComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Complete Quiz"}
          </button>
        </>
      ) : (
        <div className="mt-6">
          <div className="mb-2 text-green-700 font-semibold">Quiz completed!</div>
          <div>XP: {result.xp}</div>
          <div>Badges: {result.badges.join(", ")}</div>
        </div>
      )}
    </div>
  );
} 