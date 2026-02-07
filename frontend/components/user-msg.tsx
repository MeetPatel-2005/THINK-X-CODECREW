import React from "react";
import File from "./Icons/file";

interface UserMsgProps {
  usermsg?: string;
  attachment?: {
    name: string;
    size: number;
    type: string;
  } | null;
}

const UserMsg = ({ usermsg, attachment }: UserMsgProps) => {
  return (
    <div className="w-full flex flex-col justify-end items-end relative z-10">
      {attachment && (
        <div className="w-fit pl-4 mb-1.5">
          <div className="w-full flex items-center gap-3 rounded-x-2xl rounded-t-2xl rounded-bl-2xl rounded-br-sm border border-zinc-300 bg-blue-500 backdrop-blur-sm px-4 py-3 shadow-sm">
            <div className="p-2 bg-blue-100 rounded-md border border-zinc-300">
              <File className="size-6 text-blue-700" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm text-white font-medium">
                {attachment.name}
              </p>
              <p className="text-xs text-zinc-200">
                {Math.ceil(attachment.size / 1024)} KB • {attachment.type}
              </p>
            </div>
          </div>
        </div>
      )}
      {usermsg && (
        <h1 className="bg-blue-500 text-white px-4 py-2 rounded-x-2xl rounded-t-2xl rounded-bl-2xl rounded-br-sm max-w-[75%]">
          {usermsg}
        </h1>
      )}
    </div>
  );
};

export default UserMsg;