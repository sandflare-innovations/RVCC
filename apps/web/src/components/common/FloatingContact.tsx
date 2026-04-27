"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPhone, FiMail, FiX, FiBook, FiMessageCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { cn } from "@lib/utils";

const ACTIONS = [
  {
    icon: FiPhone,
    label: "Call Us",
    href: "tel:+1234567890"
  },
  {
    icon: FiBook,
    label: "Contact",
    href: "#"
  },
  {
    icon: FaWhatsapp,
    label: "WhatsApp",
    href: "https://wa.me/1234567890"
  },
  {
    icon: FiMail,
    label: "Email",
    href: "mailto:info@example.com"
  },
];

export const FloatingContact = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 left-8 z-[100] flex flex-col items-center gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-2 flex flex-col items-center gap-4"
          >
            {ACTIONS.map((action, index) => (
              <motion.a
                key={action.label}
                href={action.href}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: (ACTIONS.length - index - 1) * 0.05
                  }
                }}
                exit={{
                  opacity: 0,
                  scale: 0.5,
                  y: 20,
                  transition: {
                    duration: 0.2,
                    delay: index * 0.05
                  }
                }}
                whileHover={{ scale: 1.1, backgroundColor: "#0073BC" }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-colors duration-300 hover:bg-brand-blue border-2 border-brand-blue text-brand-blue hover:text-background",
                )}
                aria-label={action.label}
              >
                <action.icon className="h-6 w-6" />
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-500 border-brand-blue border-3 bg-brand-blue text-background",
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <FiX className="h-8 w-8" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <FiMessageCircle className="h-8 w-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
