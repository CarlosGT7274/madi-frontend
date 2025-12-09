import Image from "next/image";

export default function DashboardHome() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center justify-center -z-10">
        <Image
          src="/Logo.svg"
          alt="Logo MADI"
          width={1600}
          height={1600}
          className="w-full max-w-[1000px] object-contain opacity-90"
        />
      </div>
    </div>
  );
}
