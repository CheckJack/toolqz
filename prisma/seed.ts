import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { affiliatePrograms } from "./data/affiliate-programs";
import { websites } from "../src/data/websites";
import {
  fiveProductivityAppsContent,
  fiveProductivityAppsExcerpt,
} from "../src/data/blog-content/five-productivity-apps";
import { productivityApps2026Excerpt } from "../src/data/blog-guides/productivity-apps-2026";
import { dedupeKey, normalizeCompanyName } from "../src/lib/affiliates";
import { AffiliateSeedInput } from "../src/types/affiliate";

const prisma = new PrismaClient();

function toAffiliatePayload(
  input: AffiliateSeedInput,
  toolId: string | null
) {
  return {
    companyName: input.companyName,
    website: input.website ?? null,
    signupUrl: input.signupUrl ?? null,
    status: input.status ?? "PENDING",
    priority: input.priority ?? "MEDIUM",
    category: input.category ?? null,
    commission: input.commission ?? null,
    isRecurring: input.isRecurring ?? null,
    cookieDuration: input.cookieDuration ?? null,
    affiliateNetwork: input.affiliateNetwork ?? null,
    notes: input.notes ?? null,
    source: input.source ?? "import",
    toolId,
  };
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@toolqz.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "toolqz2024";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "team@toolqz.com" },
    update: {},
    create: {
      email: "team@toolqz.com",
      name: "Team Member",
      passwordHash: await bcrypt.hash("team2024", 12),
      role: "MEMBER",
    },
  });

  const slugToId: Record<string, string> = {};
  const nameToId: Record<string, string> = {};

  for (const site of websites) {
    const tool = await prisma.tool.upsert({
      where: { slug: site.slug },
      update: {
        name: site.name,
        description: site.description,
        overview: site.overview,
        highlights: JSON.stringify(site.highlights),
        url: site.url,
        category: site.category,
        tags: JSON.stringify(site.tags),
        featured: site.featured ?? false,
        rating: site.rating ?? null,
        published: true,
        logoUrl: site.logoUrl,
        screenshots: JSON.stringify(site.screenshots),
        whoIsItFor: site.whoIsItFor,
        notForYouIf: site.notForYouIf ?? null,
        howItWorks: JSON.stringify(site.howItWorks),
        pricing: JSON.stringify(site.pricing),
        pros: JSON.stringify(site.pros),
        cons: JSON.stringify(site.cons),
        faq: JSON.stringify(site.faq),
        lastReviewed: site.lastReviewed ?? null,
      },
      create: {
        slug: site.slug,
        name: site.name,
        description: site.description,
        overview: site.overview,
        highlights: JSON.stringify(site.highlights),
        url: site.url,
        category: site.category,
        tags: JSON.stringify(site.tags),
        featured: site.featured ?? false,
        rating: site.rating ?? null,
        published: true,
        logoUrl: site.logoUrl,
        screenshots: JSON.stringify(site.screenshots),
        whoIsItFor: site.whoIsItFor,
        notForYouIf: site.notForYouIf ?? null,
        howItWorks: JSON.stringify(site.howItWorks),
        pricing: JSON.stringify(site.pricing),
        pros: JSON.stringify(site.pros),
        cons: JSON.stringify(site.cons),
        faq: JSON.stringify(site.faq),
        lastReviewed: site.lastReviewed ?? null,
      },
    });

    slugToId[site.slug] = tool.id;
    nameToId[normalizeCompanyName(site.name)] = tool.id;
  }

  await prisma.affiliateActivity.deleteMany();
  await prisma.affiliateProgram.deleteMany();
  await prisma.tool.updateMany({ data: { affiliateUrl: null } });

  const seen = new Set<string>();

  for (const program of affiliatePrograms) {
    const key = dedupeKey(program.companyName, program.signupUrl);
    if (seen.has(key)) continue;
    seen.add(key);

    const toolId = program.toolSlug
      ? slugToId[program.toolSlug] ?? null
      : nameToId[normalizeCompanyName(program.companyName)] ?? null;

    const payload = toAffiliatePayload(program, toolId);

    if (toolId) {
      await prisma.affiliateProgram.upsert({
        where: { toolId },
        update: payload,
        create: payload,
      });
      continue;
    }

    const existing = await prisma.affiliateProgram.findFirst({
      where: {
        companyName: program.companyName,
        signupUrl: program.signupUrl ?? null,
        toolId: null,
      },
    });

    if (existing) {
      await prisma.affiliateProgram.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.affiliateProgram.create({ data: payload });
    }
  }

  const count = await prisma.affiliateProgram.count();

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  const blogPosts = [
    {
      slug: "how-we-test-digital-tools",
      title: "How we test digital tools before recommending them",
      excerpt:
        "A behind-the-scenes look at how TOOLQZ evaluates websites and apps — from signup friction to pricing transparency.",
      coverImage: "/images/blog/how-we-test-digital-tools.png",
      published: true,
      publishedAt: new Date("2026-06-15"),
      content: `We don't list tools we haven't used. That sounds obvious, but most directories scrape marketing copy and call it a day. Here's what we actually do.

## Sign up like a real user

We create an account the way a normal person would — no press demos, no special onboarding calls. If signup is confusing, that's going in the review.

## Use the core workflow

We spend time in the product's main use case. For a meal kit, we cook a recipe. For a design tool, we make something we'd actually publish. Surface-level clicks don't count.

## Check pricing honestly

We read the pricing page, note what's free vs paid, and watch for surprise limits. If a tool hides costs until checkout, readers hear about it.

## Write for humans

Every listing includes who it's for, pros, cons, and clear affiliate disclosure. We'd rather say "skip this" than pad the directory.`,
    },
    {
      slug: "five-productivity-apps-worth-your-time",
      title: "5 productivity apps actually worth your time in 2026",
      excerpt: productivityApps2026Excerpt,
      coverImage: "/images/blog/five-productivity-apps-worth-your-time.png",
      published: true,
      publishedAt: new Date("2026-06-22"),
      content: fiveProductivityAppsContent,
    },
  ] as const;

  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        published: post.published,
        publishedAt: post.publishedAt,
        authorId: admin?.id ?? null,
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        published: post.published,
        publishedAt: post.publishedAt,
        authorId: admin?.id ?? null,
      },
    });
  }

  const blogCount = await prisma.blogPost.count();

  await prisma.linkPage.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      title: "TOOLQZ",
      bio: "Curated life-hack tools worth your time.",
      backgroundType: "gradient",
      backgroundColor: "#272727",
      gradientFrom: "#272727",
      gradientTo: "#4b2559",
      buttonColor: "#6db4e8",
      buttonTextColor: "#18181b",
      buttonStyle: "rounded",
      showBranding: true,
      links: {
        create: [
          { title: "Browse tools", url: "/", icon: "🔗", sortOrder: 0, enabled: true },
          { title: "Blog", url: "/blog", icon: "✍️", sortOrder: 1, enabled: true },
          { title: "Partnerships", url: "/work-with-us", icon: "🤝", sortOrder: 2, enabled: true },
        ],
      },
    },
  });

  console.log("Database seeded successfully.");
  console.log(`Affiliate programs in CRM: ${count}`);
  console.log(`Blog posts: ${blogCount}`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Team login: team@toolqz.com / team2024");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
