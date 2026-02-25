"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const TinyMceEditor = dynamic(
  () => import("@tinymce/tinymce-react").then((module) => module.Editor),
  { ssr: false },
);

type TinyMceFieldProps = {
  id: string;
  name: string;
  label: string;
  initialValue?: string;
  height?: number;
};

export function TinyMceField({
  id,
  name,
  label,
  initialValue = "",
  height = 360,
}: TinyMceFieldProps) {
  const [value, setValue] = useState(initialValue);
  const editorConfig = useMemo(() => ({
    height,
    menubar: true,
    branding: false,
    resize: true,
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "wordcount",
      "code",
    ],
    toolbar:
      "undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image table | code fullscreen",
    content_style:
      "body { font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.65; padding: 12px; }",
  }), [height]);

  return (
    <div className="admin-field admin-rich-text-field">
      <label htmlFor={id}>{label}</label>
      <TinyMceEditor
        id={id}
        apiKey="no-api-key"
        value={value}
        init={editorConfig}
        onEditorChange={(nextValue) => setValue(nextValue)}
      />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
