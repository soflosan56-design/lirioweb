import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';

type AuthMode = 'login' | 'register';

type AuthModalProps = {
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<void>;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function AuthModal({ onClose, onSignIn, onSignUp, onNotify }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRegister && !displayName.trim()) return setError('Escribe el nombre que verán los demás.');
    if (!email.trim() || !password) return setError('Completa el email y la contraseña.');
    setSubmitting(true);
    setError(null);
    try {
      if (isRegister) {
        await onSignUp(email.trim(), password, displayName.trim());
        onNotify('Cuenta creada. ¡Bienvenida a Lirio!', 'success');
      } else {
        await onSignIn(email.trim(), password);
        onNotify('Sesión iniciada', 'success');
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isRegister ? 'Crear cuenta' : 'Iniciar sesión'} onClose={onClose} maxWidthClass="max-w-md">
      <div role="tablist" aria-label="Acceso" className="mb-6 grid grid-cols-2 border-2 border-ink-900">
        {(['login', 'register'] as AuthMode[]).map((option) => {
          const active = option === mode;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMode(option);
                setError(null);
              }}
              className={`px-4 py-2.5 font-display text-lg uppercase tracking-wide transition-colors ${
                active ? 'bg-pink-500 text-ink-900' : 'bg-paper-50 text-ink-700 hover:bg-yellow-100'
              }`}
            >
              {option === 'login' ? 'Entrar' : 'Registrarse'}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <label className="block">
            <span className="field-label">Nombre</span>
            <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} autoComplete="nickname" />
          </label>
        )}
        <label className="block">
          <span className="field-label">Email</span>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="block">
          <span className="field-label">Contraseña</span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={6}
          />
        </label>
        {error && <p role="alert" className="text-sm font-bold text-pink-700">{error}</p>}
        <button type="submit" disabled={submitting} className="scrap-button w-full bg-yellow-500 px-5 py-3 text-xl text-ink-900 hover:bg-yellow-300">
          {submitting ? 'Un momento...' : isRegister ? 'Crear cuenta' : 'Entrar'}
        </button>
      </form>
    </Modal>
  );
}
