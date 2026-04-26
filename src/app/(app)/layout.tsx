import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CollectionProvider } from '@/contexts/CollectionContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Onboarding from '@/components/Onboarding';
import GuestDataImporter from '@/components/GuestDataImporter';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CollectionProvider userId={user?.id ?? null}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
        <Onboarding />
        {/* Auto-import guest data when user logs in */}
        {user && <GuestDataImporter userId={user.id} />}
        {/* Floating support button */}
        <Link
          href="/config?section=support"
          className="fixed z-40 bottom-20 w-12 h-12 rounded-full bg-[#00B8D4] text-white shadow-[0_4px_20px_rgba(0,184,212,0.55)] flex items-center justify-center text-xl active:scale-95 transition-transform"
          style={{ right: 'max(1rem, calc((100vw - 480px) / 2 + 1rem))' }}
          aria-label="Apoyar el proyecto"
        >
          🤝
        </Link>
      </div>
    </CollectionProvider>
  );
}
