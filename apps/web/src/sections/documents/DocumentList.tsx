"use client";

import { useEffect, useRef, useState } from "react";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";

import { Icons } from "@repo/ui";

import { Button } from "@/components/ui/Button";
import { DOCUMENTS, DocumentItem } from "@/data/documents";

const FlipbookReader = dynamic(() => import("./FlipbookReader").then((mod) => mod.FlipbookReader), {
  ssr: false,
});

const PasswordModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", ""]);
      setError(false);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError(false);

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const enteredPassword = otp.join("");
    const correctPassword = process.env.NEXT_PUBLIC_DOC_PASSWORD || "1234";

    if (enteredPassword === correctPassword) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setOtp(["", "", "", ""]);
      inputs.current[0]?.focus();
    }
  };

  useEffect(() => {
    if (otp.every((val) => val !== "")) {
      handleSubmit();
    }
  }, [otp]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white p-12 shadow-2xl"
          >
            <div className="mb-10 text-center">
              <h3 className="font-heading mb-4 text-3xl text-zinc-900 uppercase">Secure Access</h3>
              <p className="text-sm font-medium text-zinc-500">
                Please enter the 4-digit code to download this resource.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col items-center">
              <div className="mb-10 flex gap-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`h-14 w-14 border text-center text-2xl font-bold transition-all outline-none ${
                      error
                        ? "border-red-500 bg-red-50 text-red-900"
                        : "focus:border-brand-blue border-zinc-200 bg-zinc-50"
                    }`}
                  />
                ))}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 text-[10px] font-bold tracking-widest text-red-500 uppercase"
                >
                  Incorrect Password. Please try again.
                </motion.p>
              )}

              <Button type="submit" variant="primary" className="w-full">
                Verify & Download
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const DocumentCard = ({
  item,
  index,
  onRead,
}: {
  item: DocumentItem;
  index: number;
  onRead: (item: DocumentItem) => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const handleReadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRead(item);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const shareUrl = `${window.location.origin}/documents/${item.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  const handleSuccess = () => {
    // Trigger download
    const link = document.createElement("a");
    link.href = item.fileUrl;
    link.download = item.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="group"
      >
        <div className="flex h-full flex-col border border-zinc-100 bg-white p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.06)] transition-all duration-500 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] sm:flex-row">
          {/* Left: Enhanced 3D Book Representation */}
          <div className="perspective-1000 relative mx-auto mb-8 aspect-[3/4.5] w-full shrink-0 sm:mx-0 sm:mb-0 sm:w-44 md:w-48">
            {/* Main Book Body with slight persistent rotate */}
            <div className="rotate-y-negative-10 absolute inset-0 z-10 origin-left overflow-hidden border border-zinc-200 bg-white shadow-[10px_10px_30px_rgba(0,0,0,0.15)] transition-transform duration-700 group-hover:rotate-y-0">
              {/* Cover Image with Inset Effect */}
              <div className="absolute inset-1 overflow-hidden">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
                {/* Subtle Cover Texture/Light Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
              </div>

              {/* Realistic Rounded Spine */}
              <div className="absolute top-0 left-0 z-20 h-full w-5 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
              <div className="absolute top-0 left-0 z-30 h-full w-1 bg-white/10" />

              {/* Decorative Lines */}
              <div className="absolute right-6 bottom-6 z-20 h-px w-8 bg-white/40" />
            </div>

            {/* Realistic Stacked Pages Effect - Anchored to Spine */}
            {/* Page 1 (Closest to cover) */}
            <div className="absolute top-[2px] right-[-4px] bottom-[2px] left-0 -z-10 border border-zinc-200 bg-white shadow-sm" />
            {/* Page 2 */}
            <div className="absolute top-[4px] right-[-8px] bottom-[4px] left-0 -z-20 border border-zinc-200 bg-white shadow-sm" />
            {/* Page 3 (Deepest) */}
            <div className="absolute top-[6px] right-[-12px] bottom-[6px] left-0 -z-30 border border-zinc-200 bg-white shadow-md" />
          </div>

          {/* Right: Content Section */}
          <div className="flex flex-1 flex-col sm:pl-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="text-brand-blue mb-3 block text-[10px] font-bold tracking-widest uppercase">
                  {item.category}
                </span>
                <h3 className="font-heading group-hover:text-brand-blue mb-4 text-3xl leading-[0.75em] text-zinc-900 uppercase transition-colors">
                  {item.title}
                </h3>
                <p className="mb-8 line-clamp-3 text-sm leading-relaxed font-medium text-zinc-500">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReadClick}
                  className="border-brand-blue text-brand-blue hover:bg-brand-blue border px-6 py-2 text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 hover:text-white"
                >
                  view & Read
                </button>
                <button
                  onClick={handleDownloadClick}
                  className="bg-brand-blue px-6 py-2 text-[10px] font-black tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-zinc-900"
                >
                  Download
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={handleShareClick}
                  className="hover:text-brand-blue p-2 text-zinc-400 transition-colors"
                  title="Share Document"
                >
                  <Icons.Share className="h-5 w-5" />
                </button>
                <AnimatePresence>
                  {showCopied && (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-brand-blue absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-none px-2 py-1 text-[8px] font-black tracking-widest text-white uppercase"
                    >
                      Copied!
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <PasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export const DocumentList = () => {
  const router = useRouter();

  const handleRead = (doc: DocumentItem) => {
    router.push(`/documents/${doc.slug}`);
  };

  return (
    <section className="bg-white pb-32">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {DOCUMENTS.map((item, index) => (
            <DocumentCard key={item.id} item={item} index={index} onRead={handleRead} />
          ))}
        </div>
      </div>
    </section>
  );
};
