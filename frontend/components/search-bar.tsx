"use client";
import React, { useState, useRef } from "react";
import Plus from "./Icons/plus";
import Send from "./Icons/send";

interface SearchBarProps {
  onSendMessage: (message: string) => void;
}

const SearchBar = ({ onSendMessage }: SearchBarProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMessage(e.target.value);

    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  // Handle Enter / Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (message.trim()) {
        handleSend();
      }
    }
  };

  // Send function
  const handleSend = () => {
    if (!message.trim()) return;

    onSendMessage(message);

    setMessage("");

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="flex gap-1 justify-center w-full items-end mb-8">
      <div className="w-full flex items-center justify-center gap-1 mx-auto">

        {/* Plus Button */}
        <div className="p-2 rounded-full text-white bg-zinc-900 border border-zinc-300 cursor-pointer">
          <Plus className="size-6" />
        </div>

        {/* Input Box */}
        <div className="w-full flex items-end justify-between border border-zinc-300 rounded-2xl pl-4 pr-1 py-1 shadow-md">

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Confused? Type your question…"
            className="
              outline-none
              w-full
              resize-none
              bg-transparent
              py-2
              overflow-hidden
            "
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="
              flex items-center gap-2 rounded-2xl
              bg-zinc-800 text-white
              px-4 py-2
              ml-2
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <p>Send</p>
            <Send className="size-6" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default SearchBar;
