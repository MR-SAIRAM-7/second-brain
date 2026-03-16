import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, Strikethrough, Code, 
  Heading1, Heading2, List, ListOrdered, 
  Quote, Undo, Redo, Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 mb-2 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center gap-1 pr-2 border-r border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('bold') && 'bg-white/10 text-white')}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('italic') && 'bg-white/10 text-white')}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('strike') && 'bg-white/10 text-white')}
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('code') && 'bg-white/10 text-white')}
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('link') && 'bg-white/10 text-white')}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('heading', { level: 1 }) && 'bg-white/10 text-white')}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('heading', { level: 2 }) && 'bg-white/10 text-white')}
        >
          <Heading2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('bulletList') && 'bg-white/10 text-white')}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('orderedList') && 'bg-white/10 text-white')}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn('p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors', editor.isActive('blockquote') && 'bg-white/10 text-white')}
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 pl-2 ml-auto">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
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
        class: 'prose prose-invert prose-sm sm:prose-base focus:outline-none min-h-[150px] max-w-none text-white'
      }
    }
  });

  return (
    <div className="w-full flex flex-col p-1 rounded-lg bg-white/5 border border-white/10 focus-within:border-indigo-500/50 transition-colors">
      <MenuBar editor={editor} />
      <div className="px-3 py-2 overflow-y-auto max-h-[300px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
