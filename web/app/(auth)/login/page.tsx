'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const r = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    document.cookie = `auth=dummytoken; path=/; max-age=86400`;
    r.replace('/dashboard');
  }

  return (
    <div className="max-w-sm mx-auto mt-12 surface rounded-xl p-6">
      <h1 className="text-2xl font-semibold mb-4 text-base">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <Button type="submit" className="w-full">Ingresar</Button>
        <p className="text-xs text-muted mt-1">
          Usa cualquier credencial en este entorno demo.
        </p>
      </form>
    </div>
  );
}
