import React from "react";
import ReactMarkdown from "react-markdown";

const BotMsg = ({ msg }: { msg?: string }) => {
  return (
    <div className="w-full flex flex-col items-start justify-end mb-3 relative z-10">
      <div className="bg-zinc-100/80 backdrop-blur-sm text-zinc-800 px-5 py-3.5 rounded-2xl rounded-bl-sm max-w-[80%] shadow-sm border border-zinc-200/60">
        <ReactMarkdown
          components={{
            strong: ({ children }) => (
              <strong className="font-semibold text-zinc-900">
                {children}
              </strong>
            ),
            ul: ({ children }) => (
              <ul className="space-y-1 mt-2 ml-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal space-y-1 mt-2 ml-5">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="flex items-start gap-2 text-[13.5px] leading-relaxed text-zinc-700">
                <span className="mt-1.5 h-1.5 w-1.5 min-w-[6px] rounded-full bg-blue-400" />
                <span>{children}</span>
              </li>
            ),
            p: ({ children }) => (
              <p className="text-[13.5px] leading-relaxed text-zinc-700 mt-1.5 first:mt-0">
                {children}
              </p>
            ),
            hr: () => <hr className="my-3 border-zinc-200" />,
            h1: ({ children }) => (
              <h1 className="text-[15px] font-semibold text-zinc-900 tracking-tight mt-3 mb-1.5 first:mt-0 border-b border-zinc-200/80 pb-1">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-[14px] font-semibold text-zinc-900 tracking-tight mt-3 mb-1.5 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-[13.5px] font-semibold text-zinc-800 mt-2.5 mb-1 first:mt-0">
                {children}
              </h3>
            ),
          }}
        >
          {msg || ""}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default BotMsg;
