"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableVideoItem } from "./components/SortableVideoItem";
import { useRouter } from "next/navigation";

interface Video {
  id: string;
  url: string;
  title?: string;
  description?: string;
  isActive: boolean;
}

export default function VotingPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Check Auth
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
        } else {
          setUser(data.user);
          fetchData();
        }
      });
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch available videos (filtered by exclusion logic on backend)
      const videosRes = await fetch("/api/videos");
      const videoData: Video[] = await videosRes.json();

      // 2. Fetch user's existing vote
      const voteRes = await fetch("/api/vote");
      const voteItems: { videoId: string; rank: number }[] = await voteRes.json();

      // 3. Sort videos based on existing vote
      let sortedVideos = [...videoData];
      if (voteItems.length > 0) {
        // Create a map for quick rank lookup
        const rankMap = new Map(voteItems.map((v) => [v.videoId, v.rank]));

        // Videos not in vote items (new ones?) get put at bottom? 
        // Or better: initially sorted by creation, but if votes exist, respect that.
        // Simple logic: Sort by rank if exists, else huge number.
        sortedVideos.sort((a, b) => {
          const rankA = rankMap.get(a.id) ?? 9999;
          const rankB = rankMap.get(b.id) ?? 9999;
          return rankA - rankB;
        });
      }

      setVideos(sortedVideos);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setVideos((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = videos.map((video, index) => ({
        videoId: video.id,
        rank: index + 1,
      }));

      const res = await fetch("/api/vote", {
        method: "POST",
        body: JSON.stringify({ items }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setLastSaved(new Date().toLocaleTimeString());
      }
    } catch (err) {
      alert("投票の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("新しいパスワードが一致しません");
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      alert("パスワードは4文字以上にしてください");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        alert("パスワードを変更しました");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordModal(false);
      } else {
        const data = await res.json();
        alert(data.error || "パスワードの変更に失敗しました");
      }
    } catch (err) {
      alert("エラーが発生しました");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="min-h-screen text-white flex items-center justify-center">読み込み中...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 pb-32">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">動画ランキング</h1>
          <p className="text-slate-400">ドラッグ＆ドロップで動画をランキング付けしてください</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300">
            {user?.name} さん
          </span>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition"
          >
            🔑 パスワード変更
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            ログアウト
          </button>
        </div>
      </div>


      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={videos.map((v) => v.id)}
          strategy={verticalListSortingStrategy}
        >
          {videos.map((video, index) => (
            <SortableVideoItem key={video.id} video={video} index={index} />
          ))}
        </SortableContext>
      </DndContext>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl glass p-4 rounded-2xl flex items-center justify-between shadow-2xl z-50 border border-indigo-500/20">
        <div className="text-sm text-slate-300">
          {lastSaved ? `${lastSaved} に保存しました` : "変更を保存してから提出してください"}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              px-6 py-3 rounded-xl font-bold text-white transition-all transform
              ${saving
                ? "bg-slate-600 cursor-wait"
                : "bg-slate-700 hover:bg-slate-600 hover:scale-105 active:scale-95"
              }
            `}
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            onClick={async () => {
              if (!lastSaved) {
                alert("先にランキングを保存してください");
                return;
              }
              if (confirm("採点を提出しますか？\n\n提出後も内容は変更できます。")) {
                try {
                  const res = await fetch("/api/vote/submit", { method: "POST" });
                  if (res.ok) {
                    alert("採点を提出しました！\n\n管理者に結果が通知されます。");
                  } else {
                    const data = await res.json();
                    alert(data.error || "提出に失敗しました");
                  }
                } catch (err) {
                  alert("エラーが発生しました");
                }
              }
            }}
            className="px-6 py-3 rounded-xl font-bold text-white transition-all transform bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            ✅ 採点を提出
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="glass p-6 rounded-2xl border border-white/10 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">パスワード変更</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  現在のパスワード <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  新しいパスワード <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="4文字以上"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  required
                  minLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  新しいパスワード（確認） <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="もう一度入力"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-all"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${changingPassword
                    ? "bg-slate-600 cursor-wait"
                    : "bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/30"
                    }`}
                >
                  {changingPassword ? "変更中..." : "変更する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
