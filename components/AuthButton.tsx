"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="auth-btn auth-skeleton" aria-hidden="true" />;
  }

  if (session?.user) {
    return (
      <div className="auth-user">
        {session.user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="auth-avatar"
            src={session.user.image}
            alt={session.user.name ?? "Avatar"}
            width={28}
            height={28}
          />
        )}
        <span className="auth-name">{session.user.name ?? "Você"}</span>
        <button className="auth-btn" onClick={() => signOut()}>
          Sair
        </button>
      </div>
    );
  }

  return (
    <button className="auth-btn" onClick={() => signIn("google")}>
      Entrar com Google
    </button>
  );
}
