import React from "react";
import Logo from "./Logo/logo";

const Navbar = () => {
  return (
      <div className="w-full px-10 flex justify-between items-center mx-auto rounded-2xl fixed top-4 left-0 right-0 z-99">
        <div className="flex items-center gap-2">
          <Logo className="size-8" />
          <h1 className="text-2xl tracking-tight">CampusGPT</h1>
        </div>
        <button className="text-md px-4 py-2 rounded-4xl border border-black bg-black text-white cursor-pointer">
           Share 
        </button>
      </div>
  );
};

export default Navbar;
