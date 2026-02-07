"use client";

import React, { useState, useRef, useEffect } from "react";
import Plus from "./Icons/plus";
import Send from "./Icons/send";

interface SearchChatProps {
  onSendMessage: (
    message: string,
    attachment?: {
      file: File;
      name: string;
      size: number;
      type: string;
    } | null
  ) => void;

  onPdfSelect: (file: File) => void;

  pdfAttachment: {
    file: File;
    name: string;
    size: number;
    type: string;
  } | null;
}

const SearchChat = ({
  onSendMessage,
  onPdfSelect,
  pdfAttachment,
}: SearchChatProps) => {
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mark mounted (fix hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;

    setMessage(el.value);

    requestAnimationFrame(() => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    });
  };

  // Enter / Shift+Enter handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (message.trim() || pdfAttachment) {
        handleSend();
      }
    }
  };

  // Send message
  const handleSend = () => {
    if (!message.trim() && !pdfAttachment) return;

    onSendMessage(message, pdfAttachment);

    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Trigger file input
  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  // Handle PDF select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return;
    }

    onPdfSelect(file);

    // Reset input
    e.target.value = "";
  };

  return (
    <div className="flex gap-1 justify-center w-full items-end mb-8 flex-col">
      <div className="w-full flex items-center justify-center gap-1 mx-auto">

        {/* Main Box */}
        <div className="w-full flex flex-col border border-zinc-300 rounded-2xl px-3 py-2 shadow-md backdrop-blur-sm bg-white/50">

          {/* Textarea (render only after mount) */}
          {mounted && (
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Confused? Type your question…"
              className="w-full resize-none outline-none px-2 py-2 mb-3 bg-transparent overflow-hidden"
            />
          )}

          {/* Bottom Bar */}
          <div className="flex w-full items-center justify-between">

            {/* Upload Button */}
            <button
              type="button"
              onClick={handlePlusClick}
              className="px-3 py-2 rounded-full text-white bg-zinc-900 border border-zinc-300 cursor-pointer flex justify-center items-center gap-1.5 hover:opacity-90 transition"
            >
              <p className="mr-1">Upload PDF</p>
              <div className="w-px h-6 rounded-2xl bg-white" />
              <Plus className="size-6" />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!message.trim() && !pdfAttachment}
              className="flex items-center gap-2 rounded-full bg-zinc-800 text-white p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
            >
              <Send className="size-6" />
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchChat;
