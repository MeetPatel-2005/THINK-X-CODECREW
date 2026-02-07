"use client";
import React, { useState, useRef } from "react";
import Plus from "./Icons/plus";
import Send from "./Icons/send";

interface SearchChatProps {
  onSendMessage: (message: string, attachment?: { file: File; name: string; size: number; type: string } | null) => void;
  onPdfSelect: (file: File) => void;
  pdfAttachment: { file: File; name: string; size: number; type: string } | null;
}

const SearchChat = ({ onSendMessage, onPdfSelect, pdfAttachment }: SearchChatProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto resize function
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMessage(e.target.value);

    // Reset height
    e.target.style.height = "auto";

    // Set new height
    e.target.style.height = e.target.scrollHeight + "px";
  };

  // Handle Enter / Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (message.trim() || pdfAttachment) {
        handleSend();
      }
    }
  };

  // Send function
  const handleSend = () => {
    if (!message.trim() && !pdfAttachment) return;

    onSendMessage(message, pdfAttachment);

    setMessage("");

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return;
    }
    onPdfSelect(file);
    e.target.value = "";
  };

  return (
    <div className="flex gap-1 justify-center w-full items-end mb-8 flex-col">
      <div className="w-full flex items-center justify-center gap-1 mx-auto">
        
        {/* Main Box */}
        <div className="w-full flex flex-col border border-zinc-300 rounded-2xl px-3 py-2 shadow-md filter backdrop-blur-sm bg-white/50">

          {/* Textarea */}
          <textarea
            ref={textareaRef} 
            rows={1}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Confused? Type your question…"
            className="
              w-full
              resize-none
              outline-none
              px-2
              py-2
              mb-3
              bg-transparent
              overflow-hidden
            "
          />

          {/* Bottom Bar */}
          <div className="flex w-full items-center justify-between">

            {/* Plus */}
            <button
              type="button"
              onClick={handlePlusClick}
              className="px-3 py-2 rounded-full text-white bg-zinc-900 border border-zinc-300 cursor-pointer flex justify-center items-center gap-3"
            >
              <p>Upload Pdf</p>
              <div className="w-0.5 h-5 bg-white"></div>
              <Plus className="size-6" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!message.trim() && !pdfAttachment}
              className="flex items-center gap-2 rounded-full bg-zinc-800 text-white p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* <p>Send</p> */}
              <Send className="size-6" />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SearchChat;
