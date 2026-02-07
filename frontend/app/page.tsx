import Chat from "@/components/chat";
import Grainient from "@/components/Grainient";
import MainPlaceholder from "@/components/main-placeholder";
import Navbar from "@/components/navbar";


export default function Home() {
  return (
    <div className="bg-white min-h-screen w-full flex relative z-10">
        <Navbar />
      <Grainient
        color1="#b8c9ff"
        color2="#6586d2"
        color3="#8a9ccc"
        timeSpeed={0.7}
        className="-z-10 absolute opacity-60"
      />
      <div className="flex flex-col items-center justify-end w-full max-w-3xl mx-auto z-30">
        <MainPlaceholder />
        <Chat />
      </div>
    </div>
  );
}
