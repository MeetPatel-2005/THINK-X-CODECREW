"use client";
import React, { useState } from "react";
import SearchBar from "./search-bar";
import UserMsg from "./user-msg";
import BotMsg from "./bot-msg";
import Faqs from "./faqs";
import SearchChat from "./search-chat";
import File from "./Icons/file";
import api from "@/app/api/api";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";

interface Message {
  id: string;
  text: string;
  type: "user" | "bot";
  attachment?: {
    name: string;
    size: number;
    type: string;
  } | null;
}

interface PdfAttachment {
  file: File;
  name: string;
  size: number;
  type: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    // { id: "1", text: "hey how are you doing?", type: "bot" },
    // { id: "2", text: "I'm doing well, thank you! How about you?", type: "user" },
  ]);
  const [showFaqs, setShowFaqs] = useState(true);
  const [pdfAttachment, setPdfAttachment] = useState<PdfAttachment | null>(
    null,
  );
  const [isBotLoading, setIsBotLoading] = useState(false);

  const handleSendMessage = async (
    messageText: string,
    attachment?: PdfAttachment | null,
  ) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage && !attachment) return;

    setMessages((prev) => {
      const next = [...prev];
      if (attachment) {
        const sizeInKb = Math.ceil(attachment.size / 1024);
        next.push({
          id: `${Date.now()}-${Math.random()}`,
          text: "",
          type: "user",
          attachment: {
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
          },
        });
      }
      if (trimmedMessage) {
        next.push({
          id: `${Date.now()}-${Math.random()}`,
          text: trimmedMessage,
          type: "user",
        });
      }
      return next;
    });

    setShowFaqs(false);
    setPdfAttachment(null);
    setIsBotLoading(true);

    try {
      if (attachment) {
        const formData = new FormData();
        formData.append("files", attachment.file);
        formData.append(
          "query",
          trimmedMessage || "Summarize the attached PDF.",
        );

        const response = await api.post(
          "/api/files/upload-and-query",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );

        const answer = response.data?.answer;
        if (answer) {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              text: answer,
              type: "bot",
            },
          ]);
        }
        return;
      }

      const response = await api.post("/api/chat", {
        question: trimmedMessage,
      });

      const answer = response.data?.answer;
      if (answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            text: answer,
            type: "bot",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          text: "Sorry, something went wrong while generating a response.",
          type: "bot",
        },
      ]);
    } finally {
      setIsBotLoading(false);
    }
  };

  const handleFaqClick = (question: string) => {
    handleSendMessage(question);
    setShowFaqs(false);
  };

  const handlePdfSelect = (file: File) => {
    setPdfAttachment({
      file: file,
      name: file.name,
      size: file.size,
      type: file.type || "application/pdf",
    });
  };

  return (
    <LayoutGroup>
      <div className="w-full h-full relative flex flex-col">
        <div className="w-full flex-1 overflow-y-auto scrollbar-hidden flex flex-col justify-end px-4">
          <motion.div layout
          className="flex flex-col gap-2">
          {messages.map((message) => (
            <motion.div key={message.id} layout>
              {message.type === "bot" ? (
                <BotMsg msg={message.text} />
              ) : (
                <UserMsg usermsg={message.text} attachment={message.attachment} />
              )}
            </motion.div>   
          ))}
          {isBotLoading && (
            <motion.div
              className="flex gap-1 mb-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.2,
                  },
                },
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="bg-blue-500 rounded-full size-2"
                  variants={{
                    hidden: { y: 0, opacity: 0.4 },
                    visible: {
                      y: [-2, -8, -2],
                      opacity: [0.4, 1, 0.4],
                      transition: {
                        duration: 0.6,
                        ease: "easeInOut",
                        repeat: Infinity, // ✅ LOOP HERE
                        repeatType: "loop", // ✅
                        repeatDelay: 0.5, // ✅ small pause
                      },
                    },
                  }}
                />
              ))}
            </motion.div>
          )}
          </motion.div>
        </div>
        <AnimatePresence>
          {showFaqs && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Faqs onFaqClick={handleFaqClick} />
            </motion.div>
          )}
        </AnimatePresence>
        {pdfAttachment && (
          <div className="w-fit mb-1.5">
            <div className="w-full flex items-center gap-3 rounded-2xl border border-zinc-300 bg-white/60 backdrop-blur-sm px-4 py-3 shadow-sm">
              <div className="p-2 bg-white/80 rounded-md border border-zinc-300">
                <File className="size-6" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-zinc-800 font-medium">
                  {pdfAttachment.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {Math.ceil(pdfAttachment.size / 1024)} KB • {pdfAttachment.type}
                </p>
              </div>
            </div>
          </div>
        )}
        <SearchChat
          onSendMessage={handleSendMessage}
          onPdfSelect={handlePdfSelect}
          pdfAttachment={pdfAttachment}
        />
      </div>
    </LayoutGroup>
  );
};

export default Chat;
