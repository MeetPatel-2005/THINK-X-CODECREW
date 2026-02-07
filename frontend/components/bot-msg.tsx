"use client";

import React from "react";
import { motion } from "motion/react";

interface BotMsgProps {
  msg?: string;
  isAnimating?: boolean;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.007, // typing speed
    },
  },
};

const charVariants = {
  hidden: {
    opacity: 0,
    filter: "blur(8px)",
    y: 2,
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const BotMsg = ({ msg = "", isAnimating = false }: BotMsgProps) => {
  // Split into characters (keeps spaces)
  const chars = msg.split("");

  return (
    <motion.div
      className="w-full flex flex-col items-start justify-end mb-2 relative z-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h1
        className="bg-zinc-100 text-black px-4 py-2 rounded-x-2xl rounded-t-2xl rounded-br-2xl rounded-bl-sm max-w-[75%] leading-relaxed"
        variants={containerVariants}
        initial="hidden"
        animate={isAnimating ? "visible" : "hidden"}
      >
        {isAnimating
          ? chars.map((char, index) => (
              <motion.span
                key={index}
                variants={charVariants}
                className="inline-block whitespace-pre"
              >
                {char}
              </motion.span>
            ))
          : msg}
      </motion.h1>
    </motion.div>
  );
};

export default BotMsg;
