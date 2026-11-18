"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Ends the session server-side; `nextCookies()` clears the cookie in the action response. */
export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
