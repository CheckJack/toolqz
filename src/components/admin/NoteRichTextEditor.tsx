"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

const btn =
  "rounded-md border border-dark-border bg-dark-elevated px-2 py-1 text-[12px] font-medium text-muted hover:border-white/20 hover:text-white disabled:opacity-40";

export function NoteRichTextEditor({
  value,
  onChange,
  placeholder = "Write your note…",
  editable = true,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-neon underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] max-h-[480px] overflow-y-auto px-4 py-3 text-[15px] leading-relaxed text-white focus:outline-none prose prose-invert prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) {
    return (
      <div className="min-h-[220px] rounded-lg border border-dark-border bg-dark-elevated px-4 py-3 text-muted">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-dark-border bg-dark-elevated">
      {editable && (
        <div className="flex flex-wrap gap-1 border-b border-dark-border p-2">
          <button
            type="button"
            className={btn}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            Bold
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            Italic
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            Underline
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            List
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            Numbered
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("Link URL", prev || "https://");
              if (url === null) return;
              if (url === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}
          >
            Link
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
