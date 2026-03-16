import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { 
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Pilcrow,
  Eraser,
  Minus,
  Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useMemo } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
}

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL', previousUrl);

    if (url === null) {
      return;
    }

    const normalized = normalizeUrl(url);

    if (!normalized) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
  }, [editor]);

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2 bg-[#0c0f18]/90 backdrop-blur rounded-lg border border-white/10">
      <div className="flex items-center gap-1 pr-2 border-r border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('paragraph') && 'bg-white/10 text-white')}
          title="Paragraph"
        >
          <Pilcrow className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('bold') && 'bg-white/10 text-white')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('italic') && 'bg-white/10 text-white')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('strike') && 'bg-white/10 text-white')}
          title="Strike"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('code') && 'bg-white/10 text-white')}
          title="Inline code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('link') && 'bg-white/10 text-white')}
          title="Add link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50"
          title="Remove link"
        >
          <Unlink className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('heading', { level: 1 }) && 'bg-white/10 text-white')}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('heading', { level: 2 }) && 'bg-white/10 text-white')}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('codeBlock') && 'bg-white/10 text-white')}
          title="Code block"
        >
          <Code2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('bulletList') && 'bg-white/10 text-white')}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('orderedList') && 'bg-white/10 text-white')}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('blockquote') && 'bg-white/10 text-white')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors"
          title="Horizontal rule"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors"
          title="Clear formatting"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 pl-2 ml-auto">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export function RichTextEditor({ content, onChange, placeholder, className, minHeightClassName }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-gray-500 before:opacity-50 before:pointer-events-none'
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-400 underline hover:text-indigo-300 transition-colors cursor-pointer',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // Return the HTML content to the parent
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert prose-sm sm:prose-base focus:outline-none max-w-none text-white',
          minHeightClassName || 'min-h-[180px]'
        )
      }
    }
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      editor.commands.setContent(content || '<p></p>', false);
    }
  }, [content, editor]);

  const plainText = useMemo(() => {
    if (!editor) return '';
    return editor.getText().trim();
  }, [editor, content]);

  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.length;

  return (
    <div className={cn('w-full flex flex-col p-1 rounded-lg bg-white/5 border border-white/10 focus-within:border-indigo-500/50 transition-colors', className)}>
      <MenuBar editor={editor} />
      <div className="px-3 py-3 overflow-y-auto max-h-[380px]">
        <EditorContent editor={editor} />
      </div>
      <div className="border-t border-white/10 px-3 py-2 flex items-center justify-between text-xs text-gray-500">
        <span>Rich editor enabled</span>
        <span>{wordCount} words • {charCount} chars</span>
      </div>
    </div>
  );
}
