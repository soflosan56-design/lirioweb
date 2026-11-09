import { useCallback, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import HomeCover from '@/components/home/HomeCover';
import SwapPage from '@/components/swap/SwapPage';
import ShowroomPage from '@/components/showroom/ShowroomPage';
import ContentPage from '@/components/content/ContentPage';
import SubscriptionsPage from '@/components/subscriptions/SubscriptionsPage';
import ContactPage from '@/components/contact/ContactPage';
import AdminPage from '@/components/admin/AdminPage';
import WardrobeDirectoryPage from '@/components/wardrobe/WardrobeDirectoryPage';
import WardrobePage from '@/components/wardrobe/WardrobePage';
import AuthModal from '@/components/auth/AuthModal';
import CartDrawer from '@/components/cart/CartDrawer';
import ProfileModal from '@/components/profile/ProfileModal';
import FashionChatWidget from '@/components/chat/FashionChatWidget';
import Toast, { type ToastState } from '@/components/ui/Toast';
import { useAccount } from '@/hooks/useAccount';
import { useCart } from '@/hooks/useCart';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { CartMode, Product, Section } from '@/lib/types';

export default function App() {
  const [section, setSection] = useState<Section>('inicio');
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [wardrobeOwnerId, setWardrobeOwnerId] = useState<string | null>(null);

  const { user, profile, error: accountError, signIn, signUp, signOut, saveProfile } = useAccount();
  const userId = user?.id ?? null;
  const cart = useCart(userId);
  const isAdmin = useIsAdmin(userId);
  const { settings, setSettings } = useSiteSettings();

  const notify = useCallback((message: string, tone: 'success' | 'error') => {
    setToast({ id: Date.now(), message, tone });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const navigate = useCallback((next: Section) => {
    setSection(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const requireLogin = useCallback(() => setAuthOpen(true), []);

  const openWardrobe = useCallback(
    (ownerId: string) => {
      setWardrobeOwnerId(ownerId);
      navigate('armario');
    },
    [navigate]
  );

  const openProfile = useCallback(() => {
    if (userId) setProfileOpen(true);
    else setAuthOpen(true);
  }, [userId]);

  const openCart = useCallback(() => {
    if (userId) setCartOpen(true);
    else setAuthOpen(true);
  }, [userId]);

  const addToCart = useCallback(
    async (product: Product, mode: CartMode): Promise<'added' | 'exists' | 'signed_out'> => {
      if (!userId) {
        setAuthOpen(true);
        return 'signed_out';
      }
      return cart.add(product, mode);
    },
    [userId, cart.add]
  );

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen">
      <Navbar
        section={section}
        onNavigate={navigate}
        cartCount={cartCount}
        profileName={profile?.display_name ?? null}
        logoUrl={settings.theme.logoUrl}
        isAdmin={isAdmin}
        onOpenCart={openCart}
        onOpenProfile={openProfile}
      />

      {accountError && (
        <p role="alert" className="border-b-2 border-ink-900 bg-pink-100 px-4 py-2 text-center text-sm font-bold text-pink-900">
          No se pudo preparar tu cuenta: {accountError}
        </p>
      )}

      <main key={section} className="animate-pop-in">
        {section === 'inicio' && <HomeCover content={settings.home} onNavigate={navigate} />}
        {section === 'swap' && (
          <SwapPage userId={userId} onRequireLogin={requireLogin} onNotify={notify} onOpenWardrobe={openWardrobe} />
        )}
        {section === 'showroom' && <ShowroomPage onAdd={addToCart} onNotify={notify} />}
        {section === 'armarios' && <WardrobeDirectoryPage onOpenWardrobe={openWardrobe} />}
        {section === 'armario' && wardrobeOwnerId && (
          <WardrobePage
            key={wardrobeOwnerId}
            ownerId={wardrobeOwnerId}
            viewerId={userId}
            onBack={() => navigate('armarios')}
            onNotify={notify}
          />
        )}
        {section === 'contenidos' && <ContentPage />}
        {section === 'suscripciones' && <SubscriptionsPage content={settings.subscriptions} />}
        {section === 'contacto' && <ContactPage content={settings.contact} />}
        {section === 'admin' &&
          (isAdmin && userId ? (
            <AdminPage
              ownerId={userId}
              settings={settings}
              onSettingsSaved={setSettings}
              onNotify={notify}
            />
          ) : (
            <p className="mx-auto max-w-2xl px-4 py-20 text-center font-hand text-2xl text-ink-700">
              Esta sección no está disponible.
            </p>
          ))}
      </main>

      <footer className="border-t-4 border-ink-900 bg-ink-900 px-4 py-6 text-center font-hand text-lg text-yellow-400">
        LIRIO · fanzine de moda independiente
      </footer>

      {authOpen && !userId && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSignIn={signIn}
          onSignUp={signUp}
          onNotify={notify}
        />
      )}

      {cartOpen && userId && (
        <CartDrawer
          items={cart.items}
          loading={cart.loading}
          error={cart.error}
          onClose={() => setCartOpen(false)}
          onRemove={cart.remove}
          onNotify={notify}
        />
      )}

      {profileOpen && profile && (
        <ProfileModal
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSave={saveProfile}
          onSignOut={signOut}
          onOpenWardrobe={() => {
            setProfileOpen(false);
            openWardrobe(profile.id);
          }}
          onNotify={notify}
        />
      )}

      <FashionChatWidget signedIn={userId !== null} onRequireLogin={requireLogin} />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
