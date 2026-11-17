/**
 * Seeds the database with starter content taken from the CV.
 * Safe to re-run: everything is an upsert keyed on a stable id/slug,
 * and existing text you've edited in the admin is NOT overwritten.
 *
 *   npx prisma db seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient, type BlockType } from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DIRECT_URL (or DATABASE_URL) before seeding.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// ── Page copy ───────────────────────────────────────────────
const blocks: { key: string; page: string; label: string; text: string; type?: BlockType }[] = [
  {
    key: "home.hero.eyebrow",
    page: "home",
    label: "Hero eyebrow",
    text: "Adventurer's Ledger · Entry I",
  },
  { key: "home.hero.name", page: "home", label: "Hero name", text: "Matthew Pearce" },
  {
    key: "home.hero.tagline",
    page: "home",
    label: "Hero tagline",
    text: "Full stack engineer & wandering artificer of the web.",
  },
  {
    key: "home.hero.intro",
    page: "home",
    label: "Hero introduction",
    text: "I build web and mobile products end to end, from working out requirements to fixing issues in production, for clients in Germany, Canada, the US and South Africa.",
  },
  {
    key: "home.sheet.class",
    page: "home",
    label: "Character class",
    text: "Artificer (Full Stack)",
  },
  {
    key: "home.sheet.background",
    page: "home",
    label: "Character background",
    text: "Guild Engineer",
  },
  { key: "home.sheet.home", page: "home", label: "Home town", text: "Gqeberha" },
  { key: "home.raven.title", page: "home", label: "Raven CTA title", text: "Send a Raven" },
  {
    key: "home.raven.body",
    page: "home",
    label: "Raven CTA body",
    text: "Open to [ROLE TYPE] roles. Your message reaches my inbox and my phone within minutes.",
  },
  { key: "about.title", page: "about", label: "Page title", text: "Side Quests" },
  {
    key: "about.tagline",
    page: "about",
    label: "Tagline",
    text: "What the adventurer does between contracts.",
  },
  {
    key: "about.intro",
    page: "about",
    label: "Introduction",
    text: "When I'm not shipping features I'm behind a camera, training for the next triathlon, deep in an anime arc or out exploring somewhere new.",
  },
  { key: "quests.title", page: "quests", label: "Page title", text: "The Quest Board" },
  {
    key: "quests.intro",
    page: "quests",
    label: "Introduction",
    text: "Case studies from client work, told without breaking any oaths (NDAs), and personal projects forged in the open.",
  },
  { key: "chronicle.title", page: "chronicle", label: "Page title", text: "The Chronicle" },
  { key: "contact.title", page: "contact", label: "Page title", text: "Send a Raven" },
  {
    key: "contact.intro",
    page: "contact",
    label: "Introduction",
    text: "Roles, freelance work or just a hello. Write your letter below and seal it.",
  },
  {
    key: "global.footer.blurb",
    page: "global",
    label: "Footer blurb",
    text: "Full stack engineer · Gqeberha, South Africa",
  },
];

// ── Experience ──────────────────────────────────────────────
const chapters = [
  {
    id: "chapter-3",
    numeral: "III",
    role: "Software Engineer",
    company: "FantasyGo (Tsogo Sun)",
    location: "Remote, Gqeberha",
    startDate: new Date("2026-08-01"),
    endDate: null,
    summary: "Frontend, backend and Retool admin features for a fantasy sports platform.",
    bullets: [
      "Build frontend, backend and admin features in a small team, with responsive Next.js and Tailwind CSS pages",
      "Build Retool admin tools that let the operations team create and manage customer events without developer help",
      "Integrated SMS Portal for player notifications and maintain the queue that controls send timing and system load",
      "Own the features I ship, including tracking down and fixing production issues",
    ],
    stack: ["Next.js", "Tailwind CSS", "Retool", "SMS Portal"],
    order: 0,
  },
  {
    id: "chapter-2",
    numeral: "II",
    role: "Software Engineer",
    company: "COMPRSA",
    location: "Gqeberha",
    startDate: new Date("2025-04-01"),
    endDate: new Date("2026-08-01"),
    summary: "Software development consultancy: five client projects across web, mobile and AI.",
    bullets: [
      "Graphene Economics: led the web replacement of a legacy Java desktop app, migrating features one at a time while keeping the old system running",
      "Jabari Autism Play Tools (US): backend-focused work in AngularJS and Python; helped integrate OpenAI to generate clinical notes",
      "Prosperly: sole developer on a review platform with automated SMS and email requests for Google Reviews",
      "Akoya Endo: designed the database schema and REST endpoints for endodontic practice management software",
      "Total Expert: maintained a React Native app on iOS and Android",
    ],
    stack: ["AngularJS", "C#", "EF Core", "SQL Server", "Python", "React Native"],
    order: 1,
  },
  {
    id: "chapter-1",
    numeral: "I",
    role: "Software Developer",
    company: "Avocado Chocolate",
    location: "Gqeberha",
    startDate: new Date("2022-02-01"),
    endDate: new Date("2025-04-01"),
    summary:
      "Software development agency: web, mobile and game projects for clients in four countries.",
    bullets: [
      "Namola (DStv): maintained the Android app and developed new features after its acquisition",
      "Elyvate & Wall-E (Germany): frontend for a team task app; backend for an EV charging platform",
      "Operto (Canada): rebuilt an outdated B&B booking site with React, Node.js and Express",
      "Mobi Tutor & Time 2 Read: maths practice platform, and a Unity, C# and Laravel reading game",
      "Led a small frontend team through a deadline push",
    ],
    stack: ["React", "Node.js", "Express", "Android", "Unity", "Laravel"],
    order: 2,
  },
];

const education = [
  {
    id: "edu-nmu",
    title: "Advanced Diploma in Software Development",
    institution: "Nelson Mandela University",
    years: "2021 – 2022",
    kind: "diploma",
    order: 0,
  },
  {
    id: "edu-varsity",
    title: "Diploma in Software Development",
    institution: "Varsity College",
    years: "2018 – 2020",
    kind: "diploma",
    order: 1,
  },
  {
    id: "cert-aws",
    title: "AWS Certified Cloud Practitioner",
    institution: "Amazon Web Services",
    years: "2024",
    kind: "certification",
    order: 2,
  },
  {
    id: "cert-cisco",
    title: "Cisco CyberOps Associate",
    institution: "Cisco",
    years: "2022",
    kind: "certification",
    order: 3,
  },
];

// ── Skills (first in each list is the headline) ─────────────
const skills: Record<string, string[]> = {
  frontend: ["React", "Next.js", "Angular", "Tailwind CSS", "AngularJS"],
  backend: ["NestJS", "Node.js", ".NET / EF Core", "Express", "Laravel"],
  data: ["PostgreSQL", "SQL Server", "Prisma", "GraphQL", "Supabase"],
  mobile: ["React Native", "Android", "Unity"],
  cloud: ["AWS", "Git", "Jest", "Retool"],
  ai: ["Claude API", "OpenAI API", "Prompt engineering"],
};

// ── Quests (drafts — fill in the tale in the admin) ─────────
const quests = [
  {
    slug: "the-great-migration",
    title: "The Great Migration",
    client: "Graphene Economics",
    rarity: "LEGENDARY" as const,
    role: "Lead on the web rebuild",
    summary:
      "Led the web replacement of a legacy Java desktop app, one feature at a time, while the old system kept running.",
    stack: ["AngularJS", "C#", "EF Core", "SQL Server"],
    featured: true,
    chapterId: "chapter-2",
    order: 0,
  },
  {
    slug: "the-scribe-familiar",
    title: "The Scribe Familiar",
    client: "Jabari Autism Play Tools",
    rarity: "EPIC" as const,
    role: "Backend engineer",
    summary:
      "Integrated OpenAI into a live therapy platform to draft clinical notes and lighten clinicians' admin.",
    stack: ["Python", "AngularJS", "OpenAI API"],
    featured: true,
    chapterId: "chapter-2",
    order: 1,
  },
  {
    slug: "the-raven-roost",
    title: "The Raven Roost",
    client: "FantasyGo",
    rarity: "EPIC" as const,
    role: "Software engineer",
    summary:
      "Integrated SMS Portal for player notifications and run the queue that controls send timing and system load.",
    stack: ["Next.js", "Tailwind CSS", "Retool", "SMS Portal"],
    featured: true,
    chapterId: "chapter-3",
    order: 2,
  },
  {
    slug: "the-lone-herald",
    title: "The Lone Herald",
    client: "Prosperly",
    rarity: "EPIC" as const,
    role: "Sole developer",
    summary:
      "Sole developer on a review platform that sends automated SMS and email requests for Google Reviews.",
    stack: [],
    featured: false,
    chapterId: "chapter-2",
    order: 3,
  },
];

const interests = [
  { slug: "photography", title: "Photography", attribute: "Perception", featured: true, order: 0 },
  { slug: "triathlon", title: "Triathlon", attribute: "Endurance", featured: false, order: 1 },
  { slug: "anime", title: "Anime", attribute: "Lore", featured: false, order: 2 },
  { slug: "games", title: "Games", attribute: "Strategy", featured: false, order: 3 },
  { slug: "exploring", title: "Exploring", attribute: "Wanderlust", featured: false, order: 4 },
];

const runes = [
  {
    id: "first-visit",
    numeral: "I",
    title: "First Visit",
    description: "Entered the ledger",
    xp: 50,
  },
  { id: "sworn-in", numeral: "II", title: "Sworn In", description: "Signed in", xp: 100 },
  { id: "scholar", numeral: "III", title: "Scholar", description: "Read 3 quests", xp: 100 },
  {
    id: "cartographer",
    numeral: "IV",
    title: "Cartographer",
    description: "Opened the realm map",
    xp: 50,
  },
  { id: "raven-keeper", numeral: "V", title: "Raven Keeper", description: "Sent a raven", xp: 100 },
  {
    id: "oracles-favour",
    numeral: "VI",
    title: "Oracle's Favour",
    description: "Asked the Oracle",
    xp: 50,
  },
  { id: "duellist", numeral: "VII", title: "Duellist", description: "Won a duel", xp: 150 },
  {
    id: "hidden",
    numeral: "?",
    title: "Hidden",
    description: "Found the secret page",
    xp: 200,
    hidden: true,
  },
];

const settings: Record<string, unknown> = {
  openToWork: true,
  roleType: "[ROLE TYPE]",
  features: { oracle: false, runes: true, guestbook: true, duel: false, sound: false },
};

async function main() {
  for (const [i, b] of blocks.entries()) {
    await db.contentBlock.upsert({
      where: { key: b.key },
      create: { ...b, type: b.type ?? "TEXT", order: i },
      update: { label: b.label, page: b.page, order: i },
    });
  }

  for (const c of chapters) {
    await db.chapter.upsert({ where: { id: c.id }, create: c, update: {} });
  }

  for (const e of education) {
    await db.education.upsert({ where: { id: e.id }, create: e, update: {} });
  }

  for (const [category, names] of Object.entries(skills)) {
    for (const [order, name] of names.entries()) {
      await db.skill.upsert({
        where: { category_name: { category, name } },
        create: { category, name, order, headline: order === 0 },
        update: {},
      });
    }
  }

  for (const q of quests) {
    await db.quest.upsert({
      where: { slug: q.slug },
      create: { ...q, kind: "CLIENT", status: "DRAFT" },
      update: {},
    });
  }

  for (const it of interests) {
    await db.interest.upsert({
      where: { slug: it.slug },
      create: { ...it, status: "DRAFT" },
      update: {},
    });
  }

  for (const [order, r] of runes.entries()) {
    await db.rune.upsert({ where: { id: r.id }, create: { ...r, order }, update: {} });
  }

  for (const [key, value] of Object.entries(settings)) {
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: {},
    });
  }

  console.log(
    `Seeded ${blocks.length} content blocks, ${chapters.length} chapters, ${quests.length} quests, ${interests.length} side quests, ${runes.length} runes.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
