import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { XP_VALUES, getUpdatedXpAndBadges } from "../utils/gamification";

export default function Curriculum() {
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({});
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchCurriculum = async () => {
      const docRef = doc(db, "curriculum", "latest");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setCurriculum(snap.data().topics || []);
      }
      setLoading(false);
    };
    fetchCurriculum();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProgress(snap.data().progress || {});
        setUserBookmarks(snap.data().bookmarks || []);
      }
    };
    fetchUserData();
  }, []);

  const handleComplete = async (idx) => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};
    const newProgress = { ...userProgress, [idx]: true };
    let xpBadges = { xp: data.xp || 0, badges: data.badges || [] };
    if (!userProgress[idx]) {
      xpBadges = getUpdatedXpAndBadges({ action: "module", userData: { ...data, progress: newProgress } });
    }
    await updateDoc(userRef, { progress: newProgress, xp: xpBadges.xp, badges: xpBadges.badges });
    setUserProgress(newProgress);
  };

  const handleBookmark = async (idx) => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    let newBookmarks = userBookmarks.includes(idx)
      ? userBookmarks.filter(i => i !== idx)
      : [...userBookmarks, idx];
    await updateDoc(userRef, { bookmarks: newBookmarks });
    setUserBookmarks(newBookmarks);
  };

  const filteredCurriculum = curriculum.filter((topic) => {
    const searchLower = search.toLowerCase();
    const filterLower = filter.toLowerCase();
    const inTitle = topic.title.toLowerCase().includes(searchLower);
    const inSummary = topic.summary.toLowerCase().includes(searchLower);
    const inSubtopics = (topic.subtopics || []).some(sub => sub.toLowerCase().includes(searchLower));
    const matchesSearch = inTitle || inSummary || inSubtopics;
    const matchesFilter = !filter || (topic.subtopics || []).some(sub => sub.toLowerCase().includes(filterLower));
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="p-8">Loading curriculum...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-center text-white mb-8">SDET Curriculum</h1>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <input
            type="text"
            placeholder="Search topics or subtopics..."
            className="px-4 py-3 border border-gray-700 rounded-md w-full md:w-1/2 bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by subtopic..."
            className="px-4 py-3 border border-gray-700 rounded-md w-full md:w-1/3 bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredCurriculum.map((topic, idx) => (
          <div key={idx} className={`relative bg-white/30 backdrop-blur-lg rounded-3xl shadow-2xl p-8 flex flex-col gap-2 transition-transform hover:scale-105 group border-2 ${userProgress[idx] ? 'border-green-400' : 'border-transparent'}`}>
            <div className="flex justify-between items-center mb-2">
              <Link to={`/module/${idx}`} className="text-2xl font-bold text-indigo-900 group-hover:underline drop-shadow-lg">
                {topic.title}
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => handleComplete(idx)}
                  className={`px-4 py-1 rounded-xl text-white font-bold shadow ${userProgress[idx] ? "bg-green-500" : "bg-gray-400 hover:bg-green-500"} transition`}
                >
                  {userProgress[idx] ? "Completed" : "Mark Complete"}
                </button>
                <button
                  onClick={() => handleBookmark(idx)}
                  className={`px-4 py-1 rounded-xl font-bold shadow ${userBookmarks.includes(idx) ? "bg-yellow-400 text-black" : "bg-gray-200 text-gray-700 hover:bg-yellow-400 hover:text-black"} transition`}
                >
                  {userBookmarks.includes(idx) ? "Bookmarked" : "Bookmark"}
                </button>
              </div>
            </div>
            <p className="mb-2 text-indigo-900 text-lg font-medium">{topic.summary}</p>
            <ul className="list-disc pl-6 text-indigo-800 text-base">
              {topic.subtopics && topic.subtopics.map((sub, i) => (
                <li key={i}>{sub}</li>
              ))}
            </ul>
          </div>
        ))}
        {filteredCurriculum.length === 0 && (
          <div className="text-center text-white col-span-2">No topics found.</div>
        )}
      </div>
    </div>
  );
} 