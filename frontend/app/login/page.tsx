"use client";
import Grainient from "@/components/Grainient";
import Logo from "@/components/Logo/logo";
import React, { useState } from "react";

const page = () => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="w-full h-screen flex px-20 py-10 bg-blue-200/50">
      <div className="w-[48%] h-full border relative rounded-3xl overflow-hidden">
        <Grainient
          color1="#7585ff"
          color2="#3f50d5"
          color3="#8a9ccc"
          timeSpeed={1}
          className="opacity-60"
        />
        <Logo className="size-20 absolute top-10 left-10 text-white" />
        <div className="absolute bottom-10 left-10 flex flex-col gap-4">
          <h1 className="text-white font-bold text-8xl tracking-tighter max-w-3xl leading-none mb-6">
            Sign In to Your Academic Space
          </h1>
          <p className="text-white leading-none max-w-xl text-2xl">
            Log in to explore your learning resources, track your academic
            progress, and get instant assistance for your university-related
            queries—all in one place.
          </p>
        </div>
      </div>
      <div className="w-1/2 h-full border rounded-3xl overflow-hidden p-30 flex flex-col gap-10">
        <Logo className="size-14 top-10 left-10 text-zinc-800" />
        <div className="flex flex-col gap-2">
          <h1
            className="text-4xl text-black tracking-tighter"
          >
            Login to Your Account
          </h1>
          <p className="text-xl text-zinc-500">Sign in to access your personalized dashboard and resources.</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-lg font-medium text-zinc-900">Enter Email</p>
          <input type="email" placeholder="Enter your email" className="outline-none px-4 py-2 text-lg border border-zinc-400/30 rounded-lg" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-lg font-medium text-zinc-900">Enter Password</p>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Enter your password" className="outline-none px-4 py-2 text-lg border border-zinc-400/30 rounded-lg w-full pr-12" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 bg-blue-500 rounded-lg px-4 py-3 text-white">
          <button>Sign In</button>
        </div>
        <div className="flex flex-col gap-2 justify-center items-center">
          <p className="text-lg text-zinc-500 font-regular">
            Don't have an account? <a href="/signup" className="text-zinc-700 hover:text-blue-500 transition-all duration-100 ease-in-out">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default page;
