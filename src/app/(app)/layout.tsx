import { createClient } from '@/lib/supabase/server';
import { CollectionProvider } from '@/contexts/CollectionContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Onboarding from '@/components/Onboarding';

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
        {/* Floating community button — placeholder, will be wired up later */}
      </div>
    </CollectionProvider>
  );
}
