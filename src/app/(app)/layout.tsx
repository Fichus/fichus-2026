import { createClient } from '@/lib/supabase/server';
import { CollectionProvider } from '@/contexts/CollectionContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Onboarding from '@/components/Onboarding';
import UpdateNotification from '@/components/UpdateNotification';

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
        {/* One-shot bell announcing the views/sort update. Self-dismisses
            permanently via localStorage once the user closes it. */}
        <UpdateNotification />
      </div>
    </CollectionProvider>
  );
}
