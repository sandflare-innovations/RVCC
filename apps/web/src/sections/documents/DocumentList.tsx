"use client";

import Image from "next/image";

import { motion } from "framer-motion";

import { Icons } from "@repo/ui";

import { DOCUMENTS, DocumentItem } from "@/data/documents";

const DocumentCard = ({ item, index }: { item: DocumentItem; index: number }) => {
  return (
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
              <h3 className="font-heading group-hover:text-brand-blue mb-4 text-3xl text-zinc-900 uppercase transition-colors">
                {item.title}
              </h3>
              <p className="mb-8 line-clamp-3 text-sm leading-relaxed font-medium text-zinc-500">
                {item.description}
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-8">
            <div className="flex items-center gap-4">
              <button className="border-brand-blue text-brand-blue hover:bg-brand-blue border px-6 py-2 text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 hover:text-white">
                Read More
              </button>
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-blue px-6 py-2 text-[10px] font-black tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-zinc-900"
              >
                Download
              </a>
            </div>

            <button
              className="hover:text-brand-blue p-2 text-zinc-400 transition-colors"
              title="Share Document"
            >
              <Icons.Share className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const DocumentList = () => {
  return (
    <section className="bg-white pb-32">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {DOCUMENTS.map((item, index) => (
            <DocumentCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
