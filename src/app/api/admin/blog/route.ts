import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit-log";
import {
  buildBlogData,
  serializeBlogListItem,
  serializeBlogPost,
  slugifyBlogTitle,
} from "@/lib/blog-payload";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const authorInclude = { author: { select: { name: true } } } as const;
const DEFAULT_PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE))
    );
    const search = searchParams.get("search")?.trim() ?? "";
    const publishedFilter = searchParams.get("published");

    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { excerpt: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
      ...(publishedFilter === "true"
        ? { published: true }
        : publishedFilter === "false"
          ? { published: false }
          : {}),
    };

    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: authorInclude,
        orderBy: [{ updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map(serializeBlogListItem),
      total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    if (!body.title?.trim() || !body.excerpt?.trim() || !body.content?.trim()) {
      return NextResponse.json(
        { error: "title, excerpt, and content are required" },
        { status: 400 }
      );
    }

    const data = buildBlogData({
      title: body.title,
      slug: body.slug || slugifyBlogTitle(body.title),
      excerpt: body.excerpt,
      content: body.content,
      coverImage: body.coverImage,
      published: body.published,
      publishedAt: body.publishedAt,
      authorId: session.id,
    });

    const conflict = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
    if (conflict) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const post = await prisma.blogPost.create({
      data,
      include: authorInclude,
    });

    await logAudit("create", "blog_post", post.title, {
      userId: session.id,
      entityId: post.id,
    });

    return NextResponse.json(serializeBlogPost(post), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
