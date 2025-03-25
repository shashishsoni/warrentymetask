import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

// This component is a workaround for ReactQuill's findDOMNode warnings in React 18 StrictMode
// While the warnings will still appear in development, this approach minimizes their impact
const QuillEditor = forwardRef<any, QuillEditorProps>(
  ({ value, onChange, style }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<ReactQuill>(null);
    
    // Expose both the container div and quill instance
    useImperativeHandle(ref, () => ({
      getEditor: () => quillRef.current?.getEditor(),
      containerRef
    }));

    // Handle image upload
    const imageHandler = () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();
      
      input.onchange = async () => {
        if (input.files) {
          const file = input.files[0];
          const reader = new FileReader();
          
          reader.onload = () => {
            const editor = quillRef.current?.getEditor();
            if (!editor) return;
            
            const range = editor.getSelection();
            const position = range ? range.index : 0;
            
            // Insert the base64 image
            editor.insertEmbed(position, 'image', reader.result);
            editor.setSelection(position + 1, 0);
          };
          
          reader.readAsDataURL(file);
        }
      };
    };

    // Define modules with custom image handler
    const modules = useMemo(() => ({
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          [{ 'align': [] }],
          ['link', 'image', 'clean'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'font': [] }],
        ],
        handlers: {
          'image': imageHandler
        }
      },
      // Turn off history to avoid some React StrictMode issues
      history: {
        delay: 2000,
        maxStack: 500,
        userOnly: true
      },
      clipboard: {
        matchVisual: false
      }
    }), []);

    // Custom formats
    const formats = [
      'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
      'color', 'background', 'list', 'bullet', 'indent', 'link', 'image',
      'align', 'clean'
    ];

    // Use a combination of inline styles and class names
    return (
      <div 
        ref={containerRef} 
        style={{ 
          height: '100%',
          display: 'flex', 
          flexDirection: 'column',
          ...style
        }}
        className="quill-editor-container"
      >
        {/* Wrap ReactQuill to minimize findDOMNode warnings */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ReactQuill
            ref={quillRef}
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            style={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            theme="snow"
            placeholder="Start writing your letter here..."
          />
        </div>
      </div>
    );
  }
);

// Add display name to help with debugging
QuillEditor.displayName = 'QuillEditor';

export default QuillEditor; 