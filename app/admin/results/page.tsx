"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface VideoVote {
    userName: string;
    score: number;
    comment: string;
}

interface VideoResult {
    videoId: string;
    videoTitle: string;
    channelName?: string;
    votes: VideoVote[];
    totalScore: number;
    averageScore: number;
    voteCount: number;
}

interface SubmittedUser {
    id: string;
    name: string;
    submittedAt: string;
}

interface PendingUser {
    id: string;
    name: string;
}

export default function ResultsPage() {
    const [results, setResults] = useState<VideoResult[]>([]);
    const [submittedUsers, setSubmittedUsers] = useState<SubmittedUser[]>([]);
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

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
                    fetchResults();
                }
            });
    }, []);

    const fetchResults = async () => {
        try {
            const res = await fetch("/api/admin/results");
            const data = await res.json();
            setResults(data.videoResults || []);
            setSubmittedUsers(data.submittedUsers || []);
            setPendingUsers(data.pendingUsers || []);
        } catch (err) {
            console.error("Failed to load results", err);
        } finally {
            setLoading(false);
        }
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
                    <h1 className="text-3xl font-bold text-white mb-2">📊 集計結果</h1>
                    <p className="text-slate-400">採点結果の一覧</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/admin")}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
                    >
                        ← 管理画面に戻る
                    </button>
                    <button
                        onClick={fetchResults}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition"
                    >
                        🔄 更新
                    </button>
                </div>
            </div>

            {/* Submission Status */}
            <div className="glass p-6 rounded-2xl border border-white/10 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">提出状況</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-emerald-400">{submittedUsers.length}</div>
                        <div className="text-sm text-slate-400">提出済み</div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-amber-400">{pendingUsers.length}</div>
                        <div className="text-sm text-slate-400">未提出</div>
                    </div>
                </div>
                {pendingUsers.length > 0 && (
                    <div className="text-sm text-slate-400">
                        未提出: {pendingUsers.map((u) => u.name).join(", ")}
                    </div>
                )}
            </div>

            {/* Video Results */}
            <div className="glass p-6 rounded-2xl border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">動画別集計結果</h2>
                {results.length === 0 ? (
                    <p className="text-slate-400">まだ採点結果がありません</p>
                ) : (
                    <div className="space-y-6">
                        {results.map((result, idx) => (
                            <div key={result.videoId} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl font-bold text-indigo-400">#{idx + 1}</span>
                                            <h3 className="text-lg font-semibold text-white">{result.videoTitle}</h3>
                                        </div>
                                        {result.channelName && (
                                            <p className="text-sm text-slate-400">📺 {result.channelName}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-emerald-400">{result.averageScore.toFixed(1)}</div>
                                        <div className="text-xs text-slate-400">平均点</div>
                                    </div>
                                </div>

                                {/* Individual votes */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-slate-300 mb-2">個別採点:</div>
                                    {result.votes.map((vote, vIdx) => (
                                        <div key={vIdx} className="bg-slate-900/50 p-3 rounded-lg">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-white font-medium">{vote.userName}</span>
                                                <span className="text-lg font-bold text-indigo-400">{vote.score}点</span>
                                            </div>
                                            {vote.comment && (
                                                <p className="text-sm text-slate-400 mt-1">💬 {vote.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
