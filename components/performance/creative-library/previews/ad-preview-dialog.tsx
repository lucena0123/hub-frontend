import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstagramFeedAd as InstagramFeed } from './instagram-feed';
import { FacebookFeed } from './facebook-feed';
import { InstagramExplore } from './instagram-explore';
import { FacebookMarketplace } from './facebook-marketplace'; // Hypothetical if you created it, relying on what's available
import { CreativeLibraryItem } from '@/types';
import { ReactNode } from 'react';

interface AdPreviewDialogProps {
    creative: CreativeLibraryItem;
    children: ReactNode;
}

export function AdPreviewDialog({ creative, children }: AdPreviewDialogProps) {
    // Mapping creative data to specific props

    // Choose the best assets
    const imageUrl = creative.imageUrl || creative.thumbnailUrl;
    const videoUrl = creative.videoUrl; // Assuming this exists or falls back

    // Use first headline/text if array
    const headline = Array.isArray(creative.headlines) ? creative.headlines[0] : creative.headline;
    const primaryText = Array.isArray(creative.primaryTexts) ? creative.primaryTexts[0] : creative.primaryText;
    const ctaType = Array.isArray(creative.ctaTypes) ? creative.ctaTypes[0] : creative.ctaType;

    // Hardcoded for now based on user context, or passed from creative
    const username = "Costa & Lucena Advogados";
    const avatarUrl = ""; // Could come from a client config

    const sharedProps = {
        username,
        avatarUrl,
        imageUrl,
        videoUrl,
        headline,
        primaryText,
        ctaType,
        caption: primaryText, // IG uses primary text as caption
        ctaText: formatCta(ctaType),
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[900px] w-full h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-gray-50/50">
                <div className="p-4 border-b bg-white flex items-center justify-between">
                    <DialogTitle className="font-semibold text-lg">Pré-visualização do Anúncio</DialogTitle>
                </div>

                <div className="flex-1 overflow-hidden flex justify-center">
                    <Tabs defaultValue="ig-feed" className="w-full flex flex-col">
                        <div className="flex justify-center border-b bg-white px-4">
                            <TabsList className="bg-transparent h-12 gap-4">
                                <TabsTrigger value="ig-feed" className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none rounded-none px-4">
                                    Instagram Feed
                                </TabsTrigger>
                                <TabsTrigger value="fb-feed" className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none rounded-none px-4">
                                    Facebook Feed
                                </TabsTrigger>
                                <TabsTrigger value="ig-explore" className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none rounded-none px-4">
                                    Instagram Explorar
                                </TabsTrigger>
                                <TabsTrigger value="fb-marketplace" className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none rounded-none px-4">
                                    FB Marketplace
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                            <TabsContent value="ig-feed" className="mt-0 h-full flex items-start justify-center">
                                <InstagramFeed {...sharedProps} />
                            </TabsContent>

                            <TabsContent value="fb-feed" className="mt-0 h-full flex items-start justify-center">
                                <FacebookFeed {...sharedProps} />
                            </TabsContent>

                            <TabsContent value="ig-explore" className="mt-0 h-full flex items-start justify-center">
                                <InstagramExplore {...sharedProps} />
                            </TabsContent>

                            <TabsContent value="fb-marketplace" className="mt-0 h-full flex items-start justify-center">
                                <FacebookMarketplace {...sharedProps} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper (duplicated from formatters for now to avoid circular deps if needed, or import)
function formatCta(cta: string | undefined): string {
    if (!cta) return 'Saiba mais';
    return cta.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}
