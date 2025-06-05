import React, { useEffect, useState } from "react";
import { auth, db, doc, getDoc, updateDoc } from "../firebase";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data());
        setName(snap.data().name || "");
        setAvatar(snap.data().avatar || "");
        setGoals(snap.data().goals || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      await updateDoc(doc(db, "users", user.uid), {
        name,
        avatar,
        goals,
      });
      setMessage("Profile updated!");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <form onSubmit={handleSave} className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Profile Management</h2>
        {message && <div className="mb-4 text-green-600">{message}</div>}
        <input
          type="text"
          placeholder="Full Name"
          className="w-full mb-4 px-3 py-2 border rounded"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Avatar URL (optional)"
          className="w-full mb-4 px-3 py-2 border rounded"
          value={avatar}
          onChange={e => setAvatar(e.target.value)}
        />
        <textarea
          placeholder="Your learning goals (optional)"
          className="w-full mb-4 px-3 py-2 border rounded"
          value={goals}
          onChange={e => setGoals(e.target.value)}
        />
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
} 