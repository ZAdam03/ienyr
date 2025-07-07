'use client';

import Image from "next/image";
import styles from "./page.module.css";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Betöltés...</p>;
  }

  if (!session) {
    return <p>Nem vagy bejelentkezve.</p>;
  }

  const user = session.user;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Üdvözöllek, {user.name}!</h1>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Azure ID (userId):</strong> {user.id}</p>

      {user.image && (
        <img
          src={user.image}
          alt="Profilkép"
          className="mt-4 rounded-full w-24 h-24 border"
        />
      )}
    </div>
  );
}