"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Video {
    id: string;
    url: string;
    title?: string;
    description?: string;
    channelName?: string;
    isActive: boolean;
}

interface User {
    id: string;
    name: string;
    role: string;
}

interface VideoCast {
    videoId: string;
    userId: string;
}

export default function AdminPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [videoCast, setVideoCast] = useState<VideoCast[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeForm, setActiveForm] = useState<'none' | 'video' | 'password' | 'user'>('none');
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    // Video Form state
    const [formData, setFormData] = useState({
        url: "",
        title: "",
        channelName: "",
        description: "",
        castUserIds: [] as string[],
    });

    // Password Form state
    const [passwordForm, setPasswordForm] = useState({
        userId: "",
        newPassword: "",
        confirmPassword: "",
    });

    // User Form state
    const [userForm, setUserForm] = useState({
        name: "",
        role: "user",
        password: "",
    });

    useEffect(() => {
        fetch("/api/auth/me")
            .then((res) => res.json())
            .then((data) => {
                if (!data.user) {
                    router.push("/login");
                } else if (data.user.role !== "admin") {
                    router.push("/");
                } else {
                    setUser(data.user);
                    fetchData();
                }
            });
    }, []);

    const fetchData = async () => {
        try {
            const videosRes = await fetch("/api/admin/videos");
            const videosData = await videosRes.json();
            setVideos(videosData.videos || []);
            setVideoCast(videosData.videoCast || []);
            setAllUsers(videosData.users || []);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    const handleVideoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/videos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setFormData({
                    url: "",
                    title: "",
                    channelName: "",
                    description: "",
                    castUserIds: [],
                });
                setActiveForm('none');
                fetchData();
            } else {
                alert("動画の追加に失敗しました");
            }
        } catch (err) {
            alert("エラーが発生しました");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("パスワードが一致しません");
            return;
        }

        if (passwordForm.newPassword.length < 4) {
            alert("パスワードは4文字以上にしてください");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/admin/users/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: passwordForm.userId,
                    newPassword: passwordForm.newPassword,
                }),
            });

            if (res.ok) {
                alert("パスワードを変更しました");
                setPasswordForm({ userId: "", newPassword: "", confirmPassword: "" });
                setActiveForm('none');
            } else {
                const data = await res.json();
                alert(data.error || "パスワードの変更に失敗しました");
            }
        } catch (err) {
            alert("エラーが発生しました");
        } finally {
            setSaving(false);
        }
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userForm),
            });

            const data = await res.json();

            if (res.ok) {
                alert(`ユーザー「${data.user.name}」を追加しました\n\n初期パスワード: ${data.defaultPassword}`);
                setUserForm({ name: "", role: "user", password: "" });
                setActiveForm('none');
                fetchData();
            } else {
                alert(data.error || "ユーザーの追加に失敗しました");
            }
        } catch (err) {
            alert("エラーが発生しました");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`「${userName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || "削除に失敗しました");
            }
        } catch (err) {
            alert("エラーが発生しました");
        }
    };

    const handleCastToggle = (userId: string) => {
        setFormData((prev) => ({
            ...prev,
            castUserIds: prev.castUserIds.includes(userId)
                ? prev.castUserIds.filter((id) => id !== userId)
                : [...prev.castUserIds, userId],
        }));
    };

    const getCastNames = (videoId: string) => {
        const castIds = videoCast.filter((vc) => vc.videoId === videoId).map((vc) => vc.userId);
        return allUsers
            .filter((u) => castIds.includes(u.id))
            .map((u) => u.name)
            .join(", ");
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center">
                読み込み中...
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">管理者ダッシュボード</h1>
                    <p className="text-slate-400">動画とユーザーの管理</p>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-300">
                        {user?.name} さん
                    </span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                    >
                        ログアウト
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex gap-4 flex-wrap">
                <button
                    onClick={() => setActiveForm(activeForm === 'video' ? 'none' : 'video')}
                    className={`px-6 py-3 font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg ${activeForm === 'video'
                        ? 'bg-slate-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'
                        }`}
                >
                    {activeForm === 'video' ? "キャンセル" : "🎬 動画を追加"}
                </button>
                <button
                    onClick={() => setActiveForm(activeForm === 'user' ? 'none' : 'user')}
                    className={`px-6 py-3 font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg ${activeForm === 'user'
                        ? 'bg-slate-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                        }`}
                >
                    {activeForm === 'user' ? "キャンセル" : "👤 ユーザーを追加"}
                </button>
                <button
                    onClick={() => setActiveForm(activeForm === 'password' ? 'none' : 'password')}
                    className={`px-6 py-3 font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg ${activeForm === 'password'
                        ? 'bg-slate-600 text-white'
                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/30'
                        }`}
                >
                    {activeForm === 'password' ? "キャンセル" : "🔑 パスワード変更"}
                </button>
                <button
                    onClick={() => router.push('/admin/results')}
                    className="px-6 py-3 font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/30"
                >
                    📊 集計結果
                </button>
            </div>

            {/* Add User Form */}
            {activeForm === 'user' && (
                <div className="glass p-6 rounded-2xl border border-white/10 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">新規ユーザーを追加</h2>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                ユーザー名 <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={userForm.name}
                                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                placeholder="表示名を入力"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                役割
                            </label>
                            <select
                                value={userForm.role}
                                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            >
                                <option value="user">一般ユーザー</option>
                                <option value="admin">管理者</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                初期パスワード
                            </label>
                            <input
                                type="text"
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                placeholder="空欄の場合はユーザー名がパスワードになります"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                空欄の場合、ユーザー名がそのまま初期パスワードになります
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-all ${saving
                                    ? "bg-slate-600 cursor-wait"
                                    : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/30"
                                    }`}
                            >
                                {saving ? "追加中..." : "ユーザーを追加"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Password Change Form */}
            {activeForm === 'password' && (
                <div className="glass p-6 rounded-2xl border border-white/10 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">ユーザーのパスワードを変更</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                ユーザーを選択 <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={passwordForm.userId}
                                onChange={(e) => setPasswordForm({ ...passwordForm, userId: e.target.value })}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                required
                            >
                                <option value="" disabled>ユーザーを選択してください</option>
                                {allUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.role === "admin" ? "管理者" : "一般"})
                                    </option>
                                ))}
                            </select>
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
                                パスワード確認 <span className="text-red-400">*</span>
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

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-all ${saving
                                    ? "bg-slate-600 cursor-wait"
                                    : "bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/30"
                                    }`}
                            >
                                {saving ? "変更中..." : "パスワードを変更"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Add Video Form */}
            {activeForm === 'video' && (
                <div className="glass p-6 rounded-2xl border border-white/10 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">新規動画を追加</h2>
                    <form onSubmit={handleVideoSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                動画URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                動画タイトル <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="動画のタイトルを入力"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                チャンネル名
                            </label>
                            <input
                                type="text"
                                value={formData.channelName}
                                onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                                placeholder="YouTubeチャンネル名"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                説明
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="動画の説明を入力"
                                rows={3}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                出演者情報
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                出演者を選択すると、その人は投票対象から除外されます
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {allUsers
                                    .filter((u) => u.role !== "admin")
                                    .map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => handleCastToggle(u.id)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formData.castUserIds.includes(u.id)
                                                ? "bg-indigo-600 text-white"
                                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                                }`}
                                        >
                                            {u.name}
                                        </button>
                                    ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-all ${saving
                                    ? "bg-slate-600 cursor-wait"
                                    : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30"
                                    }`}
                            >
                                {saving ? "保存中..." : "動画を追加"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* User List */}
            <div className="glass p-6 rounded-2xl border border-white/10 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">ユーザー一覧</h2>
                {allUsers.length === 0 ? (
                    <p className="text-slate-400">ユーザーがいません</p>
                ) : (
                    <div className="space-y-2">
                        {allUsers.map((u) => (
                            <div
                                key={u.id}
                                className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex justify-between items-center"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-medium">{u.name}</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin"
                                            ? "bg-violet-500/20 text-violet-300"
                                            : "bg-slate-600/50 text-slate-300"
                                            }`}
                                    >
                                        {u.role === "admin" ? "管理者" : "一般"}
                                    </span>
                                </div>
                                {u.id !== user?.id && (
                                    <button
                                        onClick={() => handleDeleteUser(u.id, u.name)}
                                        className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-lg hover:bg-red-500/10 transition"
                                    >
                                        削除
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video List */}
            <div className="glass p-6 rounded-2xl border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">動画一覧</h2>
                {videos.length === 0 ? (
                    <p className="text-slate-400">動画がありません</p>
                ) : (
                    <div className="space-y-4">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-white font-medium text-lg">
                                            {video.title || "タイトルなし"}
                                        </h3>
                                        {video.channelName && (
                                            <p className="text-indigo-400 text-sm">
                                                📺 {video.channelName}
                                            </p>
                                        )}
                                        {video.description && (
                                            <p className="text-slate-400 text-sm mt-1">{video.description}</p>
                                        )}
                                        {getCastNames(video.id) && (
                                            <p className="text-violet-400 text-sm mt-1">
                                                👤 出演: {getCastNames(video.id)}
                                            </p>
                                        )}
                                        <a
                                            href={video.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-500 text-xs hover:text-indigo-400 hover:underline mt-2 block"
                                        >
                                            {video.url}
                                        </a>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${video.isActive
                                            ? "bg-green-500/20 text-green-300"
                                            : "bg-red-500/20 text-red-300"
                                            }`}
                                    >
                                        {video.isActive ? "有効" : "無効"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
