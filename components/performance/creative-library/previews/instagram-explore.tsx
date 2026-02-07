import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { InstagramFeedAd as InstagramFeed } from './instagram-feed';

interface InstagramExploreProps {
    username?: string;
    avatarUrl?: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    caption?: string;
    ctaText?: string;
    ctaType?: string;
    headline?: string;
}

export function InstagramExplore(props: InstagramExploreProps) {
    // The 'Explore' view typically opens a post in a 'Feed-like' view but with an 'Explore' header context.
    // Or it shows it in the grid. The user's screenshot suggests the "Focused View" (clicked from grid).
    // It looks identical to Feed but has a "Explorar" header.

    return (
        <div className="w-full max-w-[375px] bg-white border border-gray-200 mx-auto font-sans text-sm rounded-sm">
            {/* Explore Header (Simulation) */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
                <ChevronLeft className="h-6 w-6 cursor-pointer" />
                <span className="font-semibold text-[16px]">Explorar</span>
                <div className="w-6" /> {/* Spacer */}
            </div>

            {/* Reuse the Feed Component Layout, stripped of outer container if possible, 
          or just render it directly as the content */}
            <div className="pt-2">
                <InstagramFeed {...props} />
            </div>
        </div>
    );
}
