import React from "react";
import Logo from "./Logo/logo";

const MainPlaceholder = () => {
  return (
    <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="flex flex-col items-center justify-center w-120">
        <Logo className="size-60 text-blue-400/80" />
        <div className="text-center mt-4">
          <h1 className="text-4xl text-zinc-800 tracking-tighter mb-3">
            Ask anything about campus
          </h1>
          <p className="text-lg text-zinc-500">Get your information instantly about courses, schedules, campus facilities, and more.</p>
        </div>
      </div>
    </div>
  );
};

export default MainPlaceholder;
