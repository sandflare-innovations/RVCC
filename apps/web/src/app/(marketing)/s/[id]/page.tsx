import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { getPublicMedia } from "@/lib/content/media";
import { ShareMediaClient } from "./share-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const file = await getPublicMedia(id);

  if (!file) {
    return {
      title: "File Not Found | RVCC",
      description: "The requested shared file could not be found.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rvcc-enquiry.vercel.app";
  const shareUrl = `${siteUrl}/s/${file.id}`;
  const title = `${file.name} | RVCC Media`;
  const description =
    file.description ||
    `View and download ${file.name} shared securely via RVCC File Manager.`;

  const isImage = file.fileType === "IMAGE";
  const isVideo = file.fileType === "VIDEO";

  const ogImages = isImage
    ? [
        {
          url: file.fileUrl,
          alt: file.name,
        },
      ]
    : undefined;

  const ogVideos = isVideo
    ? [
        {
          url: file.fileUrl,
          type: file.mimeType || "video/mp4",
        },
      ]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: "RVCC",
      type: isVideo ? "video.other" : "website",
      images: ogImages,
      videos: ogVideos,
    },
    twitter: {
      card: isVideo ? "player" : "summary_large_image",
      title,
      description,
      images: isImage ? [file.fileUrl] : undefined,
    },
  };
}

export default async function SharedMediaPage({ params }: PageProps) {
  const { id } = await params;
  const file = await getPublicMedia(id);

  if (!file) {
    notFound();
  }

  return (
    <main className="relative min-h-screen bg-zinc-950 text-white flex flex-col justify-between pt-24">
      <div className="container mx-auto px-4 py-8 max-w-5xl flex-1 flex flex-col items-center justify-center">
        <ShareMediaClient file={file} />
      </div>
      <Footer />
    </main>
  );
}
