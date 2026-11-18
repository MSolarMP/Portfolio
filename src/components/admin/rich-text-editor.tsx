"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useId, useState, type ReactNode } from "react";
import { isSafeHref, type RichDoc } from "@/lib/rich-text";

/**
 * A Tiptap editor that behaves like a form field: its JSON is posted in a hidden
 * input called `name` ("" when empty). Only the features `lib/rich-text.ts` allows
 * are switched on, so what you see here is what the server keeps.
 *
 * To reset it (e.g. Revert), remount it with a new `key`.
 */
export function RichTextEditor({
  name,
  label,
  hint,
  error,
  initial,
  onChange,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  initial: RichDoc | null;
  onChange?: (json: string) => void;
}) {
  const id = useId();
  const [json, setJson] = useState(initial ? JSON.stringify(initial) : "");

  const editor = useEditor({
    immediatelyRender: false, // server render has no DOM; avoids hydration mismatch
    content: initial ?? "",
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          isAllowedUri: (url) => isSafeHref(url),
        },
      }),
    ],
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": `${id}-label`,
        ...(hint || error
          ? {
              "aria-describedby": [hint && `${id}-hint`, error && `${id}-error`]
                .filter(Boolean)
                .join(" "),
            }
          : {}),
        ...(error ? { "aria-invalid": "true" } : {}),
        class: "rich-text min-h-32 px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const next = editor.isEmpty ? "" : JSON.stringify(editor.getJSON());
      setJson(next);
      onChange?.(next);
    },
  });

  return (
    <div className="flex flex-col gap-1.5">
      {/* A contenteditable can't use <label for>, so clicking the label focuses the editor. */}
      <span
        id={`${id}-label`}
        onClick={() => editor?.commands.focus()}
        className="font-sans text-sm font-bold"
      >
        {label}
      </span>
      <div
        className={`bg-vellum-light focus-within:outline-oxblood rounded border focus-within:outline-2 focus-within:outline-offset-2 ${
          error ? "border-oxblood" : "border-rule"
        }`}
      >
        {editor ? <Toolbar editor={editor} /> : <div className="border-rule h-12 border-b" />}
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={json} />
      {hint && (
        <p id={`${id}-hint`} className="text-ink-faded text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-oxblood text-sm font-bold">
          {error}
        </p>
      )}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  // Re-renders the toolbar only when one of these values changes.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  function editLink() {
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt(
      "Link address (https://…, mailto:… or /path). Leave empty to remove.",
      current ?? "https://",
    );
    if (href === null) return; // cancelled
    if (!href.trim() || href.trim() === "https://") {
      chain().extendMarkRange("link").unsetLink().run();
    } else if (isSafeHref(href.trim())) {
      chain().extendMarkRange("link").setLink({ href: href.trim() }).run();
    } else {
      window.alert("Links must start with https://, http://, mailto: or /.");
    }
  }

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="border-rule bg-aged/40 flex flex-wrap gap-0.5 border-b p-1"
    >
      <Tool label="Bold" active={s.bold} onClick={() => chain().toggleBold().run()}>
        <b>B</b>
      </Tool>
      <Tool label="Italic" active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <i className="font-serif">I</i>
      </Tool>
      <Tool label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}>
        <s>S</s>
      </Tool>
      <Tool label="Inline code" active={s.code} onClick={() => chain().toggleCode().run()}>
        <code className="font-mono text-xs">{"<>"}</code>
      </Tool>
      <Divider />
      <Tool label="Heading" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        H2
      </Tool>
      <Tool
        label="Subheading"
        active={s.h3}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Tool>
      <Divider />
      <Tool
        label="Bulleted list"
        active={s.bullet}
        onClick={() => chain().toggleBulletList().run()}
      >
        •
      </Tool>
      <Tool
        label="Numbered list"
        active={s.ordered}
        onClick={() => chain().toggleOrderedList().run()}
      >
        1.
      </Tool>
      <Tool label="Quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
        “
      </Tool>
      <Tool label="Code block" active={s.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
        <code className="font-mono text-xs">{"{ }"}</code>
      </Tool>
      <Tool label="Link" active={s.link} onClick={editLink}>
        <span className="underline">a</span>
      </Tool>
      <Divider />
      <Tool label="Undo" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
        ↶
      </Tool>
      <Tool label="Redo" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
        ↷
      </Tool>
    </div>
  );
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // Toggle buttons announce their state; plain actions (undo) don't.
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded px-2 font-sans text-sm disabled:opacity-30 ${
        active ? "bg-leather text-on-leather" : "text-ink hover:bg-aged"
      }`}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="bg-rule mx-1 my-2 w-px" />;
}
