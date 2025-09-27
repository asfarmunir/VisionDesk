import Sidebar from "@/components/shared/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className=" h-screen flex  bg-slate-50 ">
      <Sidebar />
      <main className="flex-1 overflow-y-scroll">{children}</main>
      {/* <Footer />- */}
    </div>
  );
}
