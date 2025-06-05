import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { XP_VALUES, getUpdatedXpAndBadges } from "../utils/gamification";

export default function ModuleDetail() {
  const { idx } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({});
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const printRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "curriculum", "latest");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const topics = snap.data().topics || [];
        setTopic(topics[idx]);
      }
      setLoading(false);
    };
    fetchData();
  }, [idx]);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProgress(snap.data().progress || {});
        setUserBookmarks(snap.data().bookmarks || []);
        setNotes((snap.data().notes && snap.data().notes[idx]) || "");
      }
    };
    fetchUserData();
  }, [idx]);

  const handleComplete = async () => {
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

  const handleBookmark = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    let newBookmarks = userBookmarks.includes(idx)
      ? userBookmarks.filter(i => i !== idx)
      : [...userBookmarks, idx];
    await updateDoc(userRef, { bookmarks: newBookmarks });
    setUserBookmarks(newBookmarks);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    let allNotes = (snap.exists() && snap.data().notes) || {};
    allNotes = { ...allNotes, [idx]: notes };
    await updateDoc(userRef, { notes: allNotes });
    setSaving(false);
  };

  const handlePrint = async () => {
    const input = printRef.current;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${topic.title}-SDET-Module.pdf`);
  };

  if (loading) return <div className="p-8">Loading module...</div>;
  if (!topic) return <div className="p-8">Module not found.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 py-12 px-2">
      <div className="w-full max-w-2xl">
        <button onClick={() => navigate(-1)} className="mb-6 text-indigo-100 hover:text-white text-lg font-semibold transition">&larr; Back to Curriculum</button>
        <div ref={printRef} className="bg-white/30 backdrop-blur-lg rounded-3xl shadow-2xl p-10 mb-6 animate-fade-in">
          <h1 className="text-3xl font-extrabold text-indigo-900 mb-2 drop-shadow-lg">{topic.title}</h1>
          <p className="mb-4 text-indigo-900 text-lg font-medium">{topic.summary}</p>
          <h2 className="text-xl font-bold text-indigo-700 mb-2">Subtopics</h2>
          <ul className="list-disc pl-6 text-indigo-800 text-base mb-4">
            {topic.subtopics && topic.subtopics.map((sub, i) => (
              <li key={i}>{sub}</li>
            ))}
          </ul>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-indigo-700 mb-2">Your Notes</h3>
            <textarea
              className="w-full border-none rounded-xl p-3 min-h-[100px] bg-white/80 text-base font-medium focus:ring-2 focus:ring-indigo-400 transition"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Write your notes here..."
            />
            <button
              onClick={handleSaveNotes}
              className="mt-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform duration-200"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleComplete}
            className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg ${userProgress[idx] ? "bg-green-500" : "bg-gray-400 hover:bg-green-500"} transition`}
          >
            {userProgress[idx] ? "Completed" : "Mark Complete"}
          </button>
          <button
            onClick={handleBookmark}
            className={`px-6 py-2 rounded-xl font-bold shadow-lg ${userBookmarks.includes(idx) ? "bg-yellow-400 text-black" : "bg-gray-200 text-gray-700 hover:bg-yellow-400 hover:text-black"} transition`}
          >
            {userBookmarks.includes(idx) ? "Bookmarked" : "Bookmark"}
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold shadow-lg hover:scale-105 transition-transform duration-200"
          >
            Print / Download PDF
          </button>
        </div>
      </div>
    </div>
  );
} 