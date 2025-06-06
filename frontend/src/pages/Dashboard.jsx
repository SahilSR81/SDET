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
  const nextLevel = getNextLevel(level.level);
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
    <div className="min-h-screen flex bg-gray-900 text-gray-100">
      <aside className="w-64 bg-gray-800 p-6 hidden md:block shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-white">SDET Hub</h2>
        <nav>
          <ul className="space-y-4 text-sm">
            <li><Link to="/dashboard" className="block py-2 px-4 rounded transition duration-200 hover:bg-gray-700">Dashboard</Link></li>
            <li><Link to="/profile" className="block py-2 px-4 rounded transition duration-200 hover:bg-gray-700">Profile</Link></li>
            <li><Link to="/curriculum" className="block py-2 px-4 rounded transition duration-200 hover:bg-gray-700">Curriculum</Link></li>
            <li><Link to="/quiz/setup" className="block py-2 px-4 rounded transition duration-200 hover:bg-gray-700">Quiz</Link></li>
            <li><Link to="/projects" className="block py-2 px-4 rounded transition duration-200 hover:bg-gray-700">Projects</Link></li>
            <li><Link to="/settings" className="block py-2 px-4 rounded transition duration-200 hover:bg-gray-700">Settings</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-white">Welcome, {profile.name || profile.email}!</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <span className="text-sm font-semibold text-gray-400 block mb-2">XP</span>
              <span className="text-3xl font-bold text-green-400">{xp}</span>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <span className="text-sm font-semibold text-gray-400 block mb-2">Level</span>
              <span className="text-2xl font-bold text-blue-400">{level.name}</span>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${levelProgress}%` }}></div>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">{xp} / {nextLevel.xp} XP to {nextLevel.name}</span>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <span className="text-sm font-semibold text-gray-400 block mb-2">Streak</span>
              <span className="text-2xl font-bold text-yellow-400">{streak} days</span>
              {streakReward && <span className="mt-1 px-3 py-1 bg-orange-200 text-orange-800 rounded-full font-semibold animate-pulse">{streakReward}</span>}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Badges</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BADGES.map(badge => (
                <div key={badge.key} className={`p-4 rounded-lg shadow-md flex flex-col items-center ${getBadgeStatus(badges, badge.key) ? "bg-yellow-600 text-yellow-900" : "bg-gray-800 text-gray-400"}`}>
                  <span className="text-2xl mb-2">{badge.emoji}</span>
                  <span className="font-semibold text-center">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Progress Analytics</h2>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 