"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetch("/api/auth/login")
            .then((res) => res.json())
            .then((data) => setUsers(data))
            .catch((err) => console.error(err));
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const res = await fetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ userId: selectedUser, password }),
            headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
            const data = await res.json();
            if (data.user.role === "admin") {
                router.push("/admin");
            } else {
                router.push("/");
            }
        } else {
            const data = await res.json();
            setError(data.error || "ログインに失敗しました");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/10">
                <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    動画投票システム
                </h1>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">ユーザーを選択</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            required
                        >
                            <option value="" disabled>名前を選択してください</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25"
                    >
                        ログイン
                    </button>
                </form>
            </div>
        </div>
    );
}
