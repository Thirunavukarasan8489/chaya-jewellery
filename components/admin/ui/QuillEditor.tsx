'use client';

import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;

    if (!quillInstanceRef.current) {
      quillInstanceRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Write something...',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'clean'],
          ],
        },
      });

      quillInstanceRef.current.on('text-change', () => {
        const currentHtml = quillInstanceRef.current?.root.innerHTML || '';
        const isEmpty = currentHtml === '<p><br></p>';
        const content = isEmpty ? '' : currentHtml;

        isInternalChange.current = true;
        onChange(content);
      });
    }
  }, [onChange, placeholder]);

  useEffect(() => {
    if (quillInstanceRef.current) {
      if (isInternalChange.current) {
        isInternalChange.current = false;
        return;
      }
      
      const currentHtml = quillInstanceRef.current.root.innerHTML;
      if (value !== currentHtml && value !== undefined) {
        const delta = quillInstanceRef.current.clipboard.convert({ html: value });
        quillInstanceRef.current.setContents(delta, 'silent');
      }
    }
  }, [value]);

  return (
    <div className="quill-wrapper">
      <div ref={editorRef} />
    </div>
  );
}
