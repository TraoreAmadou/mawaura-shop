// src/app/api/auth/[...nextauth]/route.ts
// import NextAuth from "next-auth";
// import { authOptions } from "@/auth";

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

// en prod

// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions as baseAuthOptions } from "@/auth";

// ✅ On ré-exporte authOptions pour pouvoir l'importer ailleurs
// ex: import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export const authOptions = baseAuthOptions;

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
