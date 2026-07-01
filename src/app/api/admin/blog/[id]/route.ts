import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit-log";
import { buildBlogData, serializeBlogPost } from "@/lib/blog-payload";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const authorInclude = { author: { select: { name: true } } } as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: authorInclude,
    });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(serializeBlogPost(post));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.slug && body.slug !== existing.slug) {
      const conflict = await prisma.blogPost.findFirst({
        where: { slug: body.slug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      }
    }

    const data = buildBlogData({
      title: body.title ?? existing.title,
      slug: body.slug ?? existing.slug,
      excerpt: body.excerpt ?? existing.excerpt,
      content: body.content ?? existing.content,
      coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
      published: body.published !== undefined ? body.published : existing.published,
      publishedAt: body.publishedAt,
      authorId: existing.authorId ?? session.id,
      existingPublishedAt: existing.publishedAt,
    });

    const post = await prisma.blogPost.update({
      where: { id },
      data,
      include: authorInclude,
    });

    await logAudit("update", "blog_post", post.title, {
      userId: session.id,
      entityId: post.id,
    });

    return NextResponse.json(serializeBlogPost(post));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id } });

    await logAudit("delete", "blog_post", existing.title, {
      userId: session.id,
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
