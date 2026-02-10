import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

interface FacebookMarketplaceProps {
    username?: string;
    avatarUrl?: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    ctaText?: string;
    headline?: string;
}

export function FacebookMarketplace({
    username = 'Costa & Lucena Advogados Associados',
    avatarUrl,
    imageUrl,
    videoUrl,
    ctaText = 'Saber agora',
    headline,
}: FacebookMarketplaceProps) {
    const displayCta = headline || ctaText || 'Saber agora';

    return (
        <div className="w-full max-w-[375px] bg-gray-100 mx-auto font-sans text-sm rounded-sm p-4 flex flex-col gap-4">
            {/* Marketplace "Feed" Simulation */}

            {/* The Ad Card */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                {/* Header (Compact) */}
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="bg-black text-white text-[10px]">CL</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-none">
                            <span className="font-semibold text-[13px]">{username}</span>
                            <span className="text-[11px] text-gray-500">Sponsored</span>
                        </div>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>

                {/* Media */}
                <div className="relative aspect-square bg-gray-50">
                    {videoUrl ? (
                        <video src={videoUrl} controls className="w-full h-full object-cover" />
                    ) : imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt="Ad Visual"
                            fill
                            className="object-cover"
                            sizes="(max-width: 375px) 100vw, 375px"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            No Media
                        </div>
                    )}
                </div>

                {/* Footer Bar */}
                <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <span className="font-semibold text-blue-600 text-sm">
                        {displayCta}
                    </span>
                    <Button size="sm" variant="secondary" className="h-7 text-xs px-3 bg-gray-200 hover:bg-gray-300 text-gray-800">
                        Ver detalhes
                    </Button>
                </div>
            </div>
        </div>
    );
}
