import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const QUIZ_TYPES = ["MCQ", "True/False", "Coding"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function QuizSetup() {
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizType, setQuizType] = useState("MCQ");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    navigate(`/quiz/start?num=${numQuestions}&type=${quizType}&topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500">
      <form onSubmit={handleStart} className="backdrop-blur-lg bg-white/20 shadow-2xl rounded-3xl p-10 w-full max-w-lg flex flex-col items-center animate-fade-in">
        <h1 className="text-4xl font-extrabold text-white mb-4 drop-shadow-lg">Start a New Quiz</h1>
        <div className="w-full space-y-6 mb-6">
          <div>
            <label className="block mb-1 font-semibold text-indigo-100">Number of Questions</label>
            <input
              type="number"
              min={1}
              max={20}
              value={numQuestions}
              onChange={e => setNumQuestions(Number(e.target.value))}
              className="w-full border-none rounded-xl px-4 py-3 bg-white/80 text-lg font-semibold focus:ring-2 focus:ring-indigo-400 transition"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-indigo-100">Quiz Type</label>
            <select
              value={quizType}
              onChange={e => setQuizType(e.target.value)}
              className="w-full border-none rounded-xl px-4 py-3 bg-white/80 text-lg font-semibold focus:ring-2 focus:ring-indigo-400 transition"
            >
              {QUIZ_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-indigo-100">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full border-none rounded-xl px-4 py-3 bg-white/80 text-lg font-semibold focus:ring-2 focus:ring-indigo-400 transition"
              placeholder="e.g. API Testing"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-indigo-100">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full border-none rounded-xl px-4 py-3 bg-white/80 text-lg font-semibold focus:ring-2 focus:ring-indigo-400 transition"
            >
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-xl font-bold shadow-lg hover:scale-105 transition-transform duration-200">Start Quiz</button>
      </form>
    </div>
  );
} 