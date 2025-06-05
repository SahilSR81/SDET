import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QuizStart() {
  const query = useQuery();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionTime, setQuestionTime] = useState(Date.now());
  const [explanations, setExplanations] = useState([]);
  const [status, setStatus] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const printRef = useRef();

  const num = Number(query.get("num")) || 5;
  const type = query.get("type") || "MCQ";
  const topic = query.get("topic") || "General";
  const difficulty = query.get("difficulty") || "Medium";

  // Fetch user profile for PDF header
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) setUserProfile(snap.data());
    };
    fetchProfile();
  }, []);

  // Generate questions from OpenAI
  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      let prompt = "";
      if (type === "MCQ") {
        prompt = `Generate ${num} MCQ questions on ${topic} for SDET interview, each with 4 options, one correct answer, and difficulty ${difficulty}. Return as JSON array: [{question, options, answer}]`;
      } else if (type === "True/False") {
        prompt = `Generate ${num} True/False questions on ${topic} for SDET interview, with correct answer. Return as JSON array: [{question, answer}]`;
      } else if (type === "Coding") {
        prompt = `Generate ${num} coding questions for SDET interview on ${topic} (difficulty: ${difficulty}). Each should have a problem statement, sample input/output, and expected solution in JavaScript. Return as JSON array: [{question, sampleInput, sampleOutput, solution}]`;
      }
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an expert SDET interviewer." },
            { role: "user", content: prompt },
          ],
          max_tokens: 2000,
        }),
      });
      const data = await res.json();
      let qlist = [];
      try {
        qlist = JSON.parse(data.choices[0].message.content);
      } catch {
        qlist = [];
      }
      setQuestions(qlist);
      setLoading(false);
    }
    fetchQuestions();
  }, [num, type, topic, difficulty]);

  // Handle answer submission and AI validation/explanation
  async function handleAnswer(ans) {
    const q = questions[current];
    const timeSpent = Math.floor((Date.now() - questionTime) / 1000);
    let statusVal = "Skipped";
    let explanation = "No answer provided.";
    if (type === "MCQ" || type === "True/False") {
      // AI validation and explanation
      const validatePrompt = `Question: ${q.question}\nUser Answer: ${ans}\nCorrect Answer: ${q.answer}\nExplain if correct or not, and why. Return JSON: {status, explanation}`;
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an expert SDET interviewer." },
            { role: "user", content: validatePrompt },
          ],
          max_tokens: 400,
        }),
      });
      const data = await res.json();
      let ai = { status: "", explanation: "" };
      try {
        ai = JSON.parse(data.choices[0].message.content);
      } catch {
        ai = { status: ans === q.answer ? "Correct" : "Incorrect", explanation: "AI explanation unavailable." };
      }
      setAnswers(a => [...a, ans]);
      setStatus(s => [...s, ai.status]);
      setExplanations(e => [...e, ai.explanation]);
    } else if (type === "Coding") {
      // AI code check
      const validatePrompt = `Question: ${q.question}\nUser Code: ${ans}\nSample Input: ${q.sampleInput}\nSample Output: ${q.sampleOutput}\nExpected Solution: ${q.solution}\nCheck if code is correct, run test cases, and explain. Return JSON: {status, explanation}`;
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an expert SDET coding interviewer." },
            { role: "user", content: validatePrompt },
          ],
          max_tokens: 600,
        }),
      });
      const data = await res.json();
      let ai = { status: "", explanation: "" };
      try {
        ai = JSON.parse(data.choices[0].message.content);
      } catch {
        ai = { status: "Unknown", explanation: "AI explanation unavailable." };
      }
      setAnswers(a => [...a, ans]);
      setStatus(s => [...s, ai.status]);
      setExplanations(e => [...e, ai.explanation]);
    }
    setQuestionTime(Date.now());
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setShowResult(true);
      setTimeout(() => setPdfReady(true), 5000);
      // Save quiz attempt to Firestore
      saveQuizAttempt();
    }
  }

  async function saveQuizAttempt() {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};
    const quizAttempts = data.quizAttempts || [];
    quizAttempts.push({
      date: new Date().toISOString(),
      topic,
      difficulty,
      questions,
      answers,
      status,
      explanations,
      timeTaken: Math.floor((Date.now() - startTime) / 1000),
    });
    await updateDoc(userRef, { quizAttempts });
  }

  async function handlePrint() {
    const input = printRef.current;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Quiz-Report-${topic}.pdf`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500"><div className="text-white text-2xl font-bold animate-pulse">Generating quiz...</div></div>;

  if (showResult) {
    // Calculate stats
    const correct = status.filter(s => s === "Correct").length;
    const skipped = status.filter(s => s === "Skipped").length;
    const accuracy = Math.round((correct / questions.length) * 100);
    const completion = Math.round(((questions.length - skipped) / questions.length) * 100);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const dateStr = new Date().toLocaleString();
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 py-12 px-2">
        <div className="w-full max-w-3xl">
          <div ref={printRef} className="bg-white/30 backdrop-blur-lg rounded-3xl shadow-2xl p-10 mb-6 animate-fade-in">
            <div className="flex flex-wrap justify-between mb-4">
              <div>
                <div className="font-bold text-2xl text-indigo-900 mb-1">{userProfile?.name || "User"}</div>
                <div className="text-sm text-indigo-700">{auth.currentUser?.uid}</div>
                {userProfile?.avatar && <img src={userProfile.avatar} alt="Profile" className="w-14 h-14 rounded-full mt-2 shadow-lg" />}
              </div>
              <div className="text-right">
                <div className="inline-block px-4 py-1 bg-blue-200 text-blue-800 rounded-full font-semibold mb-2 text-lg">{difficulty}</div>
                <div className="text-sm text-indigo-900">Time Taken: {formatTime(timeTaken)}</div>
                <div className="text-xl font-bold text-green-700">Score: {correct * 100 / questions.length}/100</div>
              </div>
            </div>
            <div className="text-center font-extrabold text-2xl mb-2 text-indigo-900 drop-shadow-lg">SDET Quiz Report</div>
            <div className="text-center text-indigo-700 mb-6 text-lg font-semibold">Topic: {topic}</div>
            {questions.map((q, i) => (
              <div key={i} className="mb-6 border-b border-indigo-200 pb-3">
                <div className="font-bold text-lg text-indigo-900 mb-1">Q{i+1}: {q.question}</div>
                {type === "MCQ" && <div className="mb-1 text-indigo-800">Options: {q.options.join(", ")}</div>}
                {type === "Coding" && <div className="mb-1 text-sm text-indigo-700">Sample Input: {q.sampleInput} | Sample Output: {q.sampleOutput}</div>}
                <div className="flex items-center gap-2 mb-1">
                  {status[i] === "Correct" && <span className="text-green-600 text-xl">✅</span>}
                  {status[i] === "Incorrect" && <span className="text-red-600 text-xl">❌</span>}
                  {status[i] === "Skipped" && <span className="text-yellow-600 text-xl">⚠️</span>}
                  <span className="font-semibold text-indigo-900">Your Answer: {answers[i] || "-"}</span>
                  {status[i] === "Incorrect" && <span className="ml-2 text-green-700">✅ Correct: {q.answer || q.solution}</span>}
                </div>
                <div className="mb-1 text-indigo-800">💡 Explanation: {explanations[i]}</div>
                <div className="text-xs text-indigo-500">⏱️ Time: {formatTime(timeTaken)}</div>
              </div>
            ))}
            <div className="flex flex-wrap justify-between mt-4 text-base text-indigo-900 border-t border-indigo-200 pt-3">
              <div>Completion: <span className="font-bold">{completion}%</span></div>
              <div>Accuracy: <span className="font-bold">{accuracy}%</span></div>
              <div>{dateStr}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handlePrint}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-lg font-bold shadow-lg hover:scale-105 transition-transform duration-200 mb-4"
              disabled={!pdfReady}
            >
              {pdfReady ? "Download PDF Report" : "Preparing PDF..."}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-lg font-bold shadow-lg hover:scale-105 transition-transform duration-200 mb-4"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz question UI
  const q = questions[current];
  const [userInput, setUserInput] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 py-12 px-2">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-white text-xl font-bold text-center">Question {current+1} of {questions.length}</div>
        <div className="bg-white/30 backdrop-blur-lg rounded-3xl shadow-2xl p-10 mb-6 animate-fade-in">
          <div className="font-bold text-2xl text-indigo-900 mb-4">{q.question}</div>
          {type === "MCQ" && q.options && (
            <div className="space-y-3 mb-6">
              {q.options.map((opt, i) => (
                <label key={i} className="block">
                  <input
                    type="radio"
                    name="answer"
                    value={opt}
                    checked={userInput === opt}
                    onChange={e => setUserInput(e.target.value)}
                    className="mr-3 accent-indigo-500 scale-125"
                  />
                  <span className="text-lg font-semibold text-indigo-800">{opt}</span>
                </label>
              ))}
            </div>
          )}
          {type === "True/False" && (
            <div className="space-x-8 mb-6">
              <label className="inline-flex items-center">
                <input type="radio" name="answer" value="True" checked={userInput === "True"} onChange={e => setUserInput(e.target.value)} className="mr-2 accent-indigo-500 scale-125" />
                <span className="text-lg font-semibold text-indigo-800">True</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" name="answer" value="False" checked={userInput === "False"} onChange={e => setUserInput(e.target.value)} className="mr-2 accent-indigo-500 scale-125" />
                <span className="text-lg font-semibold text-indigo-800">False</span>
              </label>
            </div>
          )}
          {type === "Coding" && (
            <div className="mb-6">
              <textarea
                className="w-full border-none rounded-xl p-3 min-h-[120px] font-mono bg-white/80 text-base font-medium focus:ring-2 focus:ring-indigo-400 transition"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="Write your code here..."
              />
              <div className="text-xs text-indigo-500 mt-2">Sample Input: {q.sampleInput} | Sample Output: {q.sampleOutput}</div>
            </div>
          )}
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            <button
              onClick={() => handleAnswer(userInput)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-lg font-bold shadow-lg hover:scale-105 transition-transform duration-200"
            >
              Submit & Next
            </button>
            <button
              onClick={() => handleAnswer("")}
              className="px-8 py-3 rounded-xl bg-gray-300 text-gray-700 text-lg font-bold shadow-lg hover:scale-105 transition-transform duration-200"
            >
              Skip
            </button>
          </div>
        </div>
        <div className="text-base text-indigo-100 text-center">Time spent: {formatTime(Math.floor((Date.now() - startTime) / 1000))}</div>
      </div>
    </div>
  );
} 