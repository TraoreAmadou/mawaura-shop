import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      firstname,
      lastname,
      username,
      birthdate,
      email,
      phone,
      password,
      passwordConfirm,
    } = body;

    if (!firstname || !lastname || !username || !birthdate || !password) {
      return NextResponse.json(
        { error: "Merci de remplir tous les champs obligatoires." },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Les mots de passe ne correspondent pas." },
        { status: 400 }
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Ce pseudo est déjà utilisé." },
        { status: 400 }
      );
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé." },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        firstName: firstname,
        lastName: lastname,
        name: `${firstname} ${lastname}`,
        username,
        email: email || null,
        phone: phone || null,
        birthdate: new Date(birthdate),
        hashedPassword,
        role: "USER", // l'admin on le fixera à la main ensuite
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription." },
      { status: 500 }
    );
  }
}
