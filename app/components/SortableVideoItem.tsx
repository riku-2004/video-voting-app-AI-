import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Video {
    id: string;
    url: string;
    title?: string;
    description?: string;
}

export function SortableVideoItem({ video, index }: { video: Video; index: number }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: video.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="glass p-4 rounded-xl mb-4 flex items-center gap-4 cursor-grab active:cursor-grabbing group hover:border-indigo-500/50 transition-colors"
        >
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-800 rounded-lg font-bold text-xl text-slate-400 group-hover:text-indigo-400 border border-slate-700">
                #{index + 1}
            </div>

            {/* Thumbnail placeholder or real thumbnail if you parse URL */}
            <div className="flex-shrink-0 w-32 aspect-video bg-black/50 rounded-lg overflow-hidden border border-slate-700/50">
                {/* Simple YouTube thumbnail fetcher if URL format matches */}
                {video.url.includes("v=") ? (
                    <img
                        src={`https://img.youtube.com/vi/${video.url.split('v=')[1].split('&')[0]}/mqdefault.jpg`}
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
                <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 pointer-events-auto"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking link
                >
                    Watch on YouTube
                </a>
            </div>

            <div className="flex-shrink-0 text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
            </div>
        </div>
    );
}
