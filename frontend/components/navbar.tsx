import React from "react";
import Logo from "./Logo/logo";
import Link from "next/link";

const Navbar = () => {
  return (
    <div className="w-full px-10 flex justify-between items-center mx-auto rounded-2xl fixed top-4 left-0 right-0 z-99">
      <div className="flex items-center gap-2">
        <Logo className="size-8" />
        <h1 className="text-2xl tracking-tight">CampusGPT</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-md px-4 py-2 rounded-4xl border border-black bg-black text-white cursor-pointer">
          Share
        </button>
        <Link href="/login" className="text-md px-6 py-2 rounded-4xl bg-blue-500 hover:bg-blue-600 transition-all duration-100 ease-in-out text-white cursor-pointer">
          Login
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
