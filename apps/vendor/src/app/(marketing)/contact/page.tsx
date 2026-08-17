"use client";

import React, { useState } from "react";

import Image from "next/image";

import { AnimatePresence, motion } from "framer-motion";

import { Icons } from "@repo/ui";

import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const socialLinks = [
  {
    name: "LinkedIn",
    icon: Icons.Linkedin,
    url: "https://linkedin.com",
    label: "Professional Network",
    step: "01",
  },
  {
    name: "Instagram",
    icon: Icons.Instagram,
    url: "https://instagram.com",
    label: "Visual Portfolio",
    step: "02",
  },
  {
    name: "Facebook",
    icon: Icons.Facebook,
    url: "https://facebook.com",
    label: "Community Feed",
    step: "03",
  },
];

const faqs = [
  {
    question: "What industries do you serve?",
    answer:
      "RVCC provides comprehensive architectural and engineering solutions for residential, commercial, industrial, and infrastructure sectors across Saudi Arabia and the Middle East.",
  },
  {
    question: "How do I start a project with RVCC?",
    answer:
      "You can start by sending an inquiry through our contact form above or by visiting our Riyadh headquarters. Our team will schedule an initial consultation to understand your vision and requirements.",
  },
  {
    question: "Do you provide international services?",
    answer:
      "While our primary focus is on shaping the landscape of Saudi Arabia, we do undertake strategic international projects that align with our core expertise in precision engineering and design.",
  },
  {
    question: "What is your typical project timeline?",
    answer:
      "Timelines vary significantly based on project scale and complexity. During our discovery phase, we provide a detailed roadmap with specific milestones tailored to your project's unique needs.",
  },
];

export default function ContactPage() {
  const directionsUrl = "https://maps.app.goo.gl/2krZ3M8LdrmmGu6w6";
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="font-primary relative flex min-h-screen flex-col bg-white text-zinc-950 transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-white px-6 pt-32 pb-16">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 bg-white">
          <Image
            src="/images/hero-bg.webp"
            alt="Hero Background"
            fill
            className="object-cover opacity-20"
            priority
          />
          {/* Pure White Overlays */}
          <div className="absolute inset-0 bg-white/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white" />

          {/* Glowing Orbs */}
          <div className="bg-brand-blue/5 absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full blur-[120px]" />
          <div className="bg-brand-blue/5 absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="space-y-6"
          >
            <h4 className="text-brand-blue text-xs font-black tracking-[0.4em] uppercase">
              Get in Touch
            </h4>
            <h1 className="text-6xl leading-[0.8] font-bold text-black uppercase md:text-8xl lg:text-9xl">
              Let's build <br />
              <span className="from-brand-blue to-brand-blue/50 bg-gradient-to-r bg-clip-text text-transparent">
                Something Great
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed font-medium text-zinc-500 md:text-xl">
              Whether you have a specific project in mind or just want to explore possibilities, our
              team is ready to shape your ideas into reality.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16 flex flex-col items-center"
          >
            <div className="from-brand-blue h-24 w-px bg-gradient-to-b to-transparent opacity-50" />
            <span className="mt-4 text-[9px] font-bold tracking-[0.3em] text-zinc-400 uppercase">
              Scroll Down
            </span>
          </motion.div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="flex min-h-screen flex-col overflow-hidden border-t border-zinc-100 bg-white lg:flex-row">
        <div className="relative flex min-h-[700px] w-full flex-col justify-end overflow-hidden bg-white p-8 md:p-16 lg:h-auto lg:w-1/2 lg:p-24">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/projects/7.webp"
              alt="Architecture"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          <div className="relative z-10 mb-10 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            >
              <h2 className="text-5xl leading-[0.8] font-bold text-white uppercase md:text-6xl">
                Connect <br />
                Through Socials
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group hover:bg-brand-blue relative flex h-48 flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-black/5 transition-all duration-500 lg:h-52"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-bold text-zinc-400 transition-colors duration-500 group-hover:text-white">
                      {social.step}
                    </span>
                    <social.icon className="h-5 w-5 text-zinc-400 transition-colors duration-500 group-hover:text-white" />
                  </div>
                  <div className="mt-auto">
                    <h3 className="text-lg text-zinc-950 uppercase transition-colors duration-500 group-hover:text-white">
                      {social.name}
                    </h3>
                    <p className="mt-1 text-[10px] font-black tracking-widest text-zinc-500 uppercase transition-colors duration-500 group-hover:text-white/80">
                      {social.label}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center border-t border-zinc-100 bg-white p-8 md:p-16 lg:w-1/2 lg:border-t-0 lg:border-l lg:p-24">
          <div className="w-full max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              className="space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-zinc-950 uppercase md:text-4xl">
                  Direct Message
                </h2>
                <p className="text-sm font-medium text-zinc-500">
                  Enter your details below and we'll get back to you within 24 hours.
                </p>
              </div>

              <form className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="group space-y-2">
                    <label className="group-focus-within:text-brand-blue text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase transition-colors">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John"
                      className="focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-sm text-zinc-950 transition-all outline-none placeholder:text-zinc-300"
                    />
                  </div>
                  <div className="group space-y-2">
                    <label className="group-focus-within:text-brand-blue text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase transition-colors">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Doe"
                      className="focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-sm text-zinc-950 transition-all outline-none placeholder:text-zinc-300"
                    />
                  </div>
                </div>

                <div className="group space-y-2">
                  <label className="group-focus-within:text-brand-blue text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase transition-colors">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    className="focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-sm text-zinc-950 transition-all outline-none placeholder:text-zinc-300"
                  />
                </div>

                <div className="group space-y-2">
                  <label className="group-focus-within:text-brand-blue text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase transition-colors">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your project..."
                    className="focus:border-brand-blue w-full resize-none border-b border-zinc-200 bg-transparent py-3 text-sm text-zinc-950 transition-all outline-none placeholder:text-zinc-300"
                  />
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="shadow-brand-blue/10 h-16 w-full shadow-xl"
                >
                  Send Inquiry
                </Button>
              </form>

              <div className="flex flex-col justify-between gap-8 border-t border-zinc-100 pt-8 pb-10 text-zinc-950 md:flex-row">
                <div>
                  <h4 className="mb-2 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    Office
                  </h4>
                  <p className="text-sm font-medium text-zinc-700">
                    Al Olaya، 6705, <br />
                    Riyadh 12221, Saudi Arabia
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-[10px] font-black tracking-[0.4em] text-zinc-400 uppercase">
                    Direct
                  </h4>
                  <p className="text-sm font-medium text-zinc-700">
                    +966 11 234 5678
                    <br />
                    hello@rvcc.arch
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Google Maps Section */}
      <section className="border-t border-zinc-100 bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col space-y-12">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-2xl space-y-4">
                <h4 className="text-brand-blue text-xs font-black tracking-[0.4em] uppercase">
                  Location
                </h4>
                <h3 className="text-4xl leading-[0.8] font-bold text-zinc-950 uppercase md:text-5xl">
                  Visit our Headquarters <br /> in Riyadh
                </h3>
                <p className="text-sm font-medium text-zinc-500">
                  Located in the heart of Al Olaya, our office is the hub of architectural
                  innovation in Saudi Arabia.
                </p>
              </div>
              <Button
                variant="brand-outline"
                href={directionsUrl}
                target="_blank"
                className="h-14 min-w-[220px]"
              >
                Get Directions <Icons.ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group shadow-brand-blue/10 relative block h-[450px] w-full cursor-pointer overflow-hidden border border-zinc-200 shadow-2xl"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3625.1809265016454!2d46.686893210239944!3d24.686306477951824!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f0354ad7d00fb%3A0x41f5297d656a8b40!2sRiyadh%20Villas%20Contracting%20Co.!5e0!3m2!1sen!2sin!4v1778295833140!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="pointer-events-none brightness-100 grayscale transition-all duration-1000 group-hover:brightness-100 group-hover:grayscale-0"
              />
              <div className="bg-brand-blue/0 group-hover:bg-brand-blue/5 absolute inset-0 transition-colors duration-500" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="border-brand-blue h-24 w-24 animate-ping rounded-full border-2 opacity-0 transition-opacity duration-1000 group-hover:opacity-40" />
                <div className="bg-brand-blue absolute h-4 w-4 rounded-full opacity-0 shadow-[0_0_20px_rgba(var(--brand-blue-rgb),0.5)] transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-zinc-100 bg-white py-32">
        <div className="container mx-auto px-6">
          <div className="flex flex-col gap-16 lg:flex-row lg:gap-32">
            <div className="space-y-6 lg:w-1/3">
              <h4 className="text-brand-blue text-xs font-black tracking-[0.4em] uppercase">FAQ</h4>
              <h2 className="text-4xl leading-[0.85] font-bold text-zinc-950 uppercase md:text-5xl">
                Frequently <br />
                <span className="text-brand-blue">Asked Questions</span>
              </h2>
              <p className="max-w-xs text-sm leading-relaxed font-medium text-zinc-500">
                Find quick answers to common inquiries about our architectural and engineering
                services.
              </p>
            </div>

            <div className="space-y-4 lg:w-2/3">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-zinc-200">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="group flex w-full items-center justify-between py-8 text-left"
                  >
                    <span
                      className={cn(
                        "text-lg font-bold uppercase transition-colors duration-300 md:text-xl",
                        openFaq === index
                          ? "text-brand-blue"
                          : "group-hover:text-brand-blue text-zinc-950"
                      )}
                    >
                      {faq.question}
                    </span>
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 transition-all duration-300",
                        openFaq === index
                          ? "bg-brand-blue border-brand-blue rotate-45"
                          : "group-hover:border-brand-blue"
                      )}
                    >
                      <Icons.Plus
                        className={cn(
                          "h-4 w-4 transition-colors",
                          openFaq === index
                            ? "text-white"
                            : "group-hover:text-brand-blue text-zinc-400"
                        )}
                      />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-8 leading-relaxed font-medium text-zinc-500">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
