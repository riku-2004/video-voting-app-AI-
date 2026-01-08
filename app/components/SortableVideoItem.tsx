"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";

interface Video {
    id: string;
    url: string;
    title?: string;
    description?: string;
}

function getYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export function SortableVideoItem({ video, index }: { video: Video; index: number }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: video.id });

    const [isExpanded, setIsExpanded] = useState(false);
    const [comment, setComment] = useState("");
    const [savedComment, setSavedComment] = useState("");
    const [saving, setSaving] = useState(false);

    const youtubeId = getYouTubeId(video.url);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.5 : 1,
    };

    // Load comment when expanded
    useEffect(() => {
        if (isExpanded) {
            fetch(`/api/comments?videoId=${video.id}`)
                .then(res => res.json())
                .then(data => {
                    setComment(data.body || "");
                    setSavedComment(data.body || "");
                })
                .catch(console.error);
        }
    }, [isExpanded, video.id]);

    const handleSaveComment = async () => {
        setSaving(true);
        try {
            await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: video.id, comment }),
            });
            setSavedComment(comment);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="glass rounded-xl mb-4 overflow-hidden group hover:border-indigo-500/50 transition-colors"
        >
            {/* Header - Draggable */}
            <div
                {...attributes}
                {...listeners}
                className="p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing"
            >
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-800 rounded-lg font-bold text-xl text-slate-400 group-hover:text-indigo-400 border border-slate-700">
                    #{index + 1}
                </div>

                {/* Thumbnail */}
                <div className="flex-shrink-0 w-32 aspect-video bg-black/50 rounded-lg overflow-hidden border border-slate-700/50">
                    {youtubeId ? (
                        <img
                            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No Thumb</div>
                    )}
                </div>

                <div className="flex-grow">
                    <h3 className="font-semibold text-lg text-white mb-1">{video.title || "Untitled Video"}</h3>
                    <p className="text-sm text-slate-400 line-clamp-1">{video.description}</p>
                    {savedComment && (
                        <p className="text-xs text-indigo-400 mt-1">💬 コメント済み</p>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                >
                    {isExpanded ? "閉じる" : "動画を見る"}
                </button>

                <div className="flex-shrink-0 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                </div>
            </div>

            {/* Expanded Content - YouTube Embed + Comment */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4" onPointerDown={(e) => e.stopPropagation()}>
                    {/* YouTube Embed */}
                    {youtubeId ? (
                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                title={video.title || "YouTube video"}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        </div>
                    ) : (
                        <div className="aspect-video rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                            <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                外部リンクで開く
                            </a>
                        </div>
                    )}

                    {/* Comment Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">
                            コメント
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="この動画についてコメントを残す..."
                            rows={3}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveComment}
                                disabled={saving || comment === savedComment}
                                className={`px-4 py-2 rounded-lg font-medium text-white transition ${saving || comment === savedComment
                                        ? "bg-slate-600 cursor-not-allowed"
                                        : "bg-indigo-600 hover:bg-indigo-500"
                                    }`}
                            >
                                {saving ? "保存中..." : "コメントを保存"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
