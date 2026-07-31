import { auth } from '@/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user || {};

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Top Header 📱 */}
      <MobileNav user={user} />

      {/* Desktop Sticky Sidebar 🖥️ */}
      <Sidebar user={user} />

      {/* Main Page Area 📄 */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}