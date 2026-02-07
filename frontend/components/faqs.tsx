import React from "react";
import { motion } from "motion/react";

interface FaqsProps {
  onFaqClick: (question: string) => void;
}

const Faqs = ({ onFaqClick }: FaqsProps) => {
  const faqs = [
    {
      question:
        "What are the important dates for the upcoming semester, including registration deadlines and exam schedules?",
    },
    {
      question: "How can I access my academic records and transcripts online?",
    },
    {
      question:
        "What resources are available for students to prepare for their exams effectively?",
    },
  ];

  return (
    <motion.div
      className="w-full flex flex-col justify-end items-end mb-2 cursor-pointer relative z-10"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {faqs.map((faq, index) => (
        <h1
          key={index}
          onClick={() => onFaqClick(faq.question)}
          className="bg-zinc-200/80 text-zinc-600 px-4 py-2 rounded-xl max-w-[75%] mb-2 hover:bg-zinc-300/80 hover:text-zinc-800 transition-all duration-200"
        >
          {faq.question}
        </h1>
      ))}
    </motion.div>
  );
};

export default Faqs;
