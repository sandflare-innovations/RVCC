"use client";

import React, { useState } from "react";

import { motion } from "framer-motion";

const contact = {
  suggestion: "Suggestion",
  complaint: "Complaint",
  name: "Name",
  phone: "Phone",
  email: "Email",
  comment: "Comment",
  submit: "Submit",
};

const Contact = () => {
  const [activeType, setActiveType] = useState<"suggestion" | "complaint">("suggestion");
  const isRTL = false;

  const inputClasses =
    "w-full bg-transparent border-b border-[#0073BC] py-6 text-2xl md:text-3xl font-normal text-[#0073BC] focus:outline-none focus:border-[#0073BC] transition-colors placeholder:text-[#0073BC]";

  return (
    <section id="contact" className="bg-theme-bg section-padding px-6 md:px-20 lg:px-32">
      <div className="max-w-8xl gap-element-gap mx-auto grid grid-cols-1 items-center lg:grid-cols-2">
        {/* Left: Heading */}
        <div className="space-y-4">
          <h2
            className={`text-6xl leading-[0.85] font-bold uppercase md:text-[10rem] ${isRTL ? "text-right" : "text-left"}`}
          >
            <span className="font-brand-sec text-brand-blue mb-2 block text-5xl md:text-[10rem]">
              Contact
            </span>
            <img src="/images/logo/logo.png" alt="Contact" className="h-auto w-full" />
          </h2>
        </div>

        {/* Right: Form */}
        <div className="space-y-4">
          <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <input type="text" placeholder={contact.name} className={inputClasses} />
            </div>
            <div className="space-y-2">
              <input type="tel" placeholder={contact.phone} className={inputClasses} />
            </div>
            <div className="space-y-2">
              <input type="email" placeholder={contact.email} className={inputClasses} />
            </div>
            <div className="space-y-2">
              <textarea
                placeholder={contact.comment}
                rows={1}
                className={`${inputClasses} resize-none`}
              />
            </div>

            <div className={`flex justify-start pt-4`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex w-full items-center justify-center gap-6 overflow-hidden bg-[#0073BC] px-10 py-4 text-center text-[14px] font-bold tracking-[0.4em] text-white"
              >
                {contact.submit}
                <div className="bg-theme-bg absolute inset-0 translate-y-full transition-transform duration-500 group-hover:translate-y-0" />
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
