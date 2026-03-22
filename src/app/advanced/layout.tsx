import { Navbar } from "@/components/Navbar";

export default function AdvancedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
