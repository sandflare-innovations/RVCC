"use client";

import { clients } from "@data/clients";
import { motion } from "framer-motion";
import Image from "next/image";
import React, { useEffect, useRef } from "react";

export const ClientsGrid = () => {
  const hoverSoundRef = useRef<HTMLAudioElement | null>(null);

  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Preload a clean UI hover sound
      hoverSoundRef.current = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"
      );
      hoverSoundRef.current.volume = 0.2;

      // Preload voices
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
      }
    }
    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    };
  }, []);

  const speakName = (name: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Play a more professional, subtle hover sound
      if (hoverSoundRef.current) {
        hoverSoundRef.current.currentTime = 0;
        hoverSoundRef.current.play().catch(() => {});
      }

      window.speechSynthesis.cancel();

      // Using an exclamation mark often forces a more energetic "announcement" intonation
      const utterance = new SpeechSynthesisUtterance(`${name}!`);

      const voices = window.speechSynthesis.getVoices();

      // Prioritize sophisticated, high-quality female voices
      const professionalVoice =
        voices.find((v) => v.name.includes("Google UK English Female")) ||
        voices.find((v) => v.name.includes("Google US English Female")) ||
        voices.find((v) => v.name.includes("Female") && v.lang.startsWith("en")) ||
        voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
        voices.find((v) => v.lang.startsWith("en-GB")) ||
        voices.find((v) => v.lang.startsWith("en-US"));

      if (professionalVoice) {
        utterance.voice = professionalVoice;
      }

      // Energetic Announcement Settings:
      utterance.rate = 0.95; // Slightly faster for more energy
      utterance.pitch = 1.15; // Higher pitch overall for a bright, announcer feel
      utterance.volume = 1.0;

      // Small delay before speaking after the hover sound for a "prepared" feel
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    }
  };

  const handleMouseEnter = (name: string) => {
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    speakTimeoutRef.current = setTimeout(() => {
      speakName(name);
    }, 500); // 0.5s delay
  };

  const handleMouseLeave = () => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
  };

  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-6">
        <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="font-heading mb-6 text-5xl tracking-tighter text-zinc-900 uppercase md:text-6xl">
              Partner <span className="text-brand-blue">Network</span>
            </h2>
            <p className="text-lg font-medium text-zinc-500">
              Our collaborations span sectors including high-end real estate, energy,
              infrastructure, and urban transformation.
            </p>
          </div>
          <div className="mb-6 hidden h-px flex-1 bg-zinc-100 md:block" />
        </div>

        <div className="grid grid-cols-1 gap-px border border-zinc-100 bg-zinc-100 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              onMouseEnter={() => handleMouseEnter(client.name)}
              onMouseLeave={handleMouseLeave}
              className="group hover:shadow-brand-blue/10 relative flex flex-col items-center justify-center bg-white p-8 transition-all duration-500 hover:z-10 hover:shadow-2xl md:p-12"
            >
              {/* Logo Container */}
              <div className="relative aspect-[2/2] w-full max-w-[380px] transition-transform duration-700 group-hover:scale-125">
                <Image
                  src={client.logo}
                  alt={client.name}
                  fill
                  className="object-contain grayscale transition-all duration-500 group-hover:grayscale-0"
                />
              </div>
              {/* Architectural Accent Line */}
              <div className="bg-brand-blue absolute top-0 left-0 h-[2px] w-0 transition-all duration-700 group-hover:w-full" />
              <div className="bg-brand-blue absolute top-0 left-0 h-0 w-[2px] transition-all duration-700 group-hover:h-full" />
              <div className="bg-brand-blue absolute right-0 bottom-0 h-[2px] w-0 transition-all duration-700 group-hover:w-full" />
              <div className="bg-brand-blue absolute right-0 bottom-0 h-0 w-[2px] transition-all duration-700 group-hover:h-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
