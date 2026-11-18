import { signOut } from "@/modules/auth/auth.actions";

/** A plain form posting to a server action — no auth client shipped to the browser. */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}
