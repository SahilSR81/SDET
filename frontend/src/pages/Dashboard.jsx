import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db, doc, getDoc, updateDoc } from "../firebase";
import { getLevel, getNextLevel, BADGES, getBadgeStatus, getStreakReward } from "../utils/gamification";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState([]);
  const [streak, setStreak] = useState(0);
  const [lastLogin, setLastLogin] = useState(null);
  const [progressHistory, setProgressHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists() || !snap.data().onboardingComplete) {
        navigate("/onboarding");
        return;
      }
      const data = snap.data();
      setProfile(data);
      setXp(data.xp || 0);
      setBadges(data.badges || []);
      setStreak(data.streak || 0);
      setLastLogin(data.lastLogin || null);
      setProgressHistory(data.progressHistory || []);
      setLoading(false);
      // Streak logic
      const today = new Date().toDateString();
      if (data.lastLogin !== today) {
        let newStreak = data.streak || 0;
        if (data.lastLogin && new Date(data.lastLogin).getTime() === new Date(Date.now() - 86400000).setHours(0,0,0,0)) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
        await updateDoc(ref, { streak: newStreak, lastLogin: today });
        setStreak(newStreak);
        setLastLogin(today);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="p-8">Loading...</div>;

  const level = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const levelProgress = Math.min(100, ((xp - level.xp) / ((nextLevel.xp || xp+1) - level.xp)) * 100);
  const streakReward = getStreakReward(streak);

  // Example analytics data
  const chartData = {
    labels: ["XP", "Modules", "Streak"],
    datasets: [
      {
        label: "Progress",
        data: [xp, profile.progress ? Object.keys(profile.progress).length : 0, streak],
        backgroundColor: ["#6366f1", "#818cf8", "#a5b4fc"],
      },
    ],
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500">
      <aside className="w-72 bg-white/20 backdrop-blur-lg text-white p-8 hidden md:block shadow-2xl rounded-r-3xl mt-8 ml-4">
        <h2 className="text-2xl font-extrabold mb-8 tracking-wide drop-shadow-lg">SDET Hub</h2>
        <nav>
          <ul className="space-y-6 text-lg font-semibold">
            <li><Link to="/dashboard" className="hover:text-indigo-200 transition">Dashboard</Link></li>
            <li><Link to="/profile" className="hover:text-indigo-200 transition">Profile</Link></li>
            <li><Link to="/curriculum" className="hover:text-indigo-200 transition">Curriculum</Link></li>
            <li><Link to="/quiz/setup" className="hover:text-indigo-200 transition">Quiz</Link></li>
            <li><Link to="/projects" className="hover:text-indigo-200 transition">Projects</Link></li>
            <li><Link to="/settings" className="hover:text-indigo-200 transition">Settings</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl bg-white/30 backdrop-blur-lg rounded-3xl shadow-2xl p-10 mb-8 animate-fade-in">
          <h1 className="text-4xl font-extrabold text-indigo-900 mb-4 drop-shadow-lg">Welcome, {profile.name || profile.email}!</h1>
          <div className="flex flex-wrap gap-8 items-center justify-between mb-8">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-indigo-700">XP</span>
              <span className="text-3xl font-extrabold text-indigo-900">{xp}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-indigo-700">Level</span>
              <span className="text-2xl font-bold text-green-700">{level.name}</span>
              <div className="w-32 bg-gray-200 rounded h-3 mt-2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded" style={{ width: `${levelProgress}%` }}></div>
              </div>
              <span className="text-xs text-gray-700">{xp} / {nextLevel.xp} XP to {nextLevel.name}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-indigo-700">Streak</span>
              <span className="text-2xl font-bold text-orange-600">{streak} days</span>
              {streakReward && <span className="mt-1 px-3 py-1 bg-orange-200 text-orange-800 rounded-full font-semibold animate-pulse">{streakReward}</span>}
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-indigo-800">Badges</h2>
            <div className="flex gap-6 flex-wrap">
              {BADGES.map(badge => (
                <div key={badge.key} className={`p-5 rounded-2xl shadow-lg flex flex-col items-center transition-all ${getBadgeStatus(badges, badge.key) ? "bg-yellow-200 animate-bounce" : "bg-gray-100/70"}`}>
                  <span className="text-3xl mb-2">🏅</span>
                  <span className="font-semibold text-indigo-900">{badge.name}</span>
                  {getBadgeStatus(badges, badge.key) && <span className="text-green-600 mt-1 font-bold">Unlocked!</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-indigo-800">Progress Analytics</h2>
            <div className="bg-white/60 p-6 rounded-2xl shadow-lg">
              <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 