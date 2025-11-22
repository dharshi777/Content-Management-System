import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer, Extension } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Underline } from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Youtube } from '@tiptap/extension-youtube';
import { Gapcursor } from '@tiptap/extension-gapcursor';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { AlignLeft, AlignCenter, AlignRight, Trash2, X, Columns, UploadCloud, CheckCircle2, ExternalLink, Link2Off, Edit3 } from 'lucide-react';
import MenuBar from './MenuBar';

const prettifyHTML = (html: string) => {
  let formatted = '';
  const pad = '  ';
  let indentLevel = 0;
  const cleanHtml = html.replace(/>\s+</g, '><').trim();
  const tokens = cleanHtml.match(/<[^>]+>|[^<]+/g) as string[] || [];
  const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  tokens.forEach((token) => {
    if (token.match(/^<\//)) {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted += '\n' + pad.repeat(indentLevel) + token;
    } else if (token.match(/^<.+>$/)) {
      formatted += '\n' + pad.repeat(indentLevel) + token;
      const tagNameMatch = token.match(/^<([a-z0-9]+)/i);
      const tagName = tagNameMatch ? tagNameMatch[1] : null;
      const isVoid = tagName && voidTags.includes(tagName.toLowerCase());
      const isSelfClosing = token.match(/\/>$/);
      const isComment = token.match(/^<!--/);
      if (!isVoid && !isSelfClosing && !isComment) indentLevel++;
    } else {
      const trimmed = token.trim();
      if (trimmed) formatted += token; 
    }
  });
  return formatted.trim();
};

const CodeEditor: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState(1);

  useEffect(() => { setLines(value.split('\n').length); }, [value]);

  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (preRef.current) { preRef.current.scrollTop = scrollTop; preRef.current.scrollLeft = scrollLeft; }
      if (lineNumbersRef.current) { lineNumbersRef.current.scrollTop = scrollTop; }
    }
  };

  const highlightedCode = useMemo(() => {
    let html = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html = html.replace(/(&lt;\/?)(\w+)(.*?)(&gt;)/g, (match, p1, p2, p3, p4) => {
        const attrs = p3.replace(/([a-z0-9-]+)(=)(".*?"|'.*?')/g, (m: string, a: string, e: string, v: string) => 
            `<span class="text-purple-600">${a}</span><span class="text-slate-500">${e}</span><span class="text-red-500">${v}</span>`);
        return `<span class="text-slate-400">${p1}</span><span class="text-emerald-600 font-semibold">${p2}</span>${attrs}<span class="text-slate-400">${p4}</span>`;
    });
    return html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-slate-400 italic">$1</span>');
  }, [value]);

  return (
    <div className="relative w-full h-full flex bg-white font-mono text-sm border-t border-slate-100 rounded-b-xl">
      <div ref={lineNumbersRef} className="w-12 bg-slate-50/50 border-r border-slate-100 text-right py-6 pr-3 text-slate-300 select-none overflow-hidden flex-shrink-0"
        style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: '24px', fontSize: '12px' }}>
        {Array.from({ length: Math.max(lines, 1) }).map((_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <div className="relative flex-1 h-full overflow-hidden bg-white rounded-br-xl">
        <pre ref={preRef} className="absolute inset-0 p-6 m-0 pointer-events-none overflow-auto"
          style={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre', lineHeight: '24px', fontSize: '12px' }}
          dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        <textarea ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} onScroll={handleScroll} spellCheck={false} wrap="off"
          className="absolute inset-0 w-full h-full p-6 m-0 bg-transparent text-transparent caret-blue-600 resize-none overflow-auto focus:outline-none"
          style={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre', lineHeight: '24px', fontSize: '12px' }} />
      </div>
    </div>
  );
};

const ImageNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const { width, alt, alignment, isWrapped, marginTop, marginRight, marginBottom, marginLeft } = node.attrs;
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const imageRef = useRef<HTMLImageElement>(null);
  const resizeRef = useRef<{ startX: number; startWidth: number; direction: string } | null>(null);

  useEffect(() => { setCurrentWidth(width); }, [width]);

  const onMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (imageRef.current) {
      setIsResizing(true);
      resizeRef.current = { 
        startX: e.clientX, 
        startWidth: imageRef.current.offsetWidth,
        direction
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeRef.current) return;
    const { startX, startWidth, direction } = resizeRef.current;
    const deltaX = e.clientX - startX;
    const isLeft = direction === 'nw' || direction === 'sw';
    const newWidth = Math.max(32, isLeft ? startWidth - deltaX : startWidth + deltaX);
    setCurrentWidth(`${newWidth}px`);
  }, []);

  const onMouseUp = useCallback(() => {
    setIsResizing(false);
    if (imageRef.current) updateAttributes({ width: `${imageRef.current.offsetWidth}px` });
    resizeRef.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, [updateAttributes, onMouseMove]);

  let wrapperStyle: React.CSSProperties = { position: 'relative', lineHeight: 0, marginTop: `${marginTop}px`, marginBottom: `${marginBottom}px`, transition: 'all 0.2s' };
  if (alignment === 'center') {
    wrapperStyle = { ...wrapperStyle, display: 'block', marginLeft: 'auto', marginRight: 'auto', float: 'none', textAlign: 'center' };
  } else if (isWrapped) {
    wrapperStyle = { ...wrapperStyle, display: 'inline-block', float: alignment, marginLeft: alignment === 'left' ? (marginLeft ? `${marginLeft}px` : '0') : '24px', marginRight: alignment === 'right' ? (marginRight ? `${marginRight}px` : '0') : '24px' };
  } else {
    wrapperStyle = { ...wrapperStyle, display: 'block', float: 'none', marginLeft: alignment === 'right' ? 'auto' : (marginLeft ? `${marginLeft}px` : '0'), marginRight: alignment === 'left' ? 'auto' : (marginRight ? `${marginRight}px` : '0') };
  }

  const Handle = ({ direction, cursor }: { direction: string, cursor: string }) => (
    <span 
      onMouseDown={(e) => onMouseDown(e, direction)} 
      className={`
        absolute w-3 h-3 bg-white border-2 border-blue-600 rounded-sm shadow-sm z-20 
        hover:scale-125 transition-transform opacity-0 group-hover:opacity-100
        ${selected || isResizing ? 'opacity-100' : ''}
        ${direction === 'nw' ? '-top-1.5 -left-1.5' : ''}
        ${direction === 'ne' ? '-top-1.5 -right-1.5' : ''}
        ${direction === 'sw' ? '-bottom-1.5 -left-1.5' : ''}
        ${direction === 'se' ? '-bottom-1.5 -right-1.5' : ''}
      `}
      style={{ cursor }}
    />
  );

  return (
    <NodeViewWrapper as="span" style={wrapperStyle} className="image-node-view group">
      <span className={`relative inline-block transition-all duration-200 ${selected || isResizing ? 'ring-2 ring-blue-600 rounded-lg' : ''}`}>
        <img ref={imageRef} src={node.attrs.src} alt={alt} style={{ width: currentWidth, height: 'auto', maxWidth: '100%', display: 'block' }} className="rounded-lg shadow-md border border-slate-100" />
        
        <Handle direction="nw" cursor="nw-resize" />
        <Handle direction="ne" cursor="ne-resize" />
        <Handle direction="sw" cursor="sw-resize" />
        <Handle direction="se" cursor="se-resize" />
      </span>
    </NodeViewWrapper>
  );
};

const FloatingImageMenu: React.FC<{ editor: any; onEdit: () => void }> = ({ editor, onEdit }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      if (!editor) return;
      const { selection } = editor.state;
      if ((selection as any).node?.type.name === 'image') {
        const view = editor.view;
        const nodeViewDom = view.nodeDOM(selection.from) as HTMLElement;
        if (nodeViewDom) {
           const target = nodeViewDom.querySelector('img') || nodeViewDom;
           const imgRect = target.getBoundingClientRect();
           const editorRect = view.dom.getBoundingClientRect();
           setCoords({ top: imgRect.top - editorRect.top - 50, left: imgRect.left - editorRect.left + (imgRect.width / 2) });
           setIsVisible(true);
           return;
        }
      }
      setIsVisible(false);
    };
    editor.on('selectionUpdate', updatePosition);
    editor.on('transaction', updatePosition);
    editor.on('blur', () => setIsVisible(false));
    return () => { editor.off('selectionUpdate', updatePosition); editor.off('transaction', updatePosition); editor.off('blur', () => setIsVisible(false)); };
  }, [editor]);

  if (!isVisible) return null;
  const activeAlign = editor.getAttributes('image').alignment || 'center';
  const updateAlignment = (align: string) => editor.chain().focus().updateAttributes('image', { alignment: align }).run();

  return (
    <div className="absolute z-40 flex items-center gap-1 bg-slate-900 text-white rounded-lg shadow-lg p-1.5 transform -translate-x-1/2 animate-in fade-in zoom-in-95 duration-200" style={{ top: `${coords.top}px`, left: `${coords.left}px` }} onMouseDown={(e) => e.preventDefault()}>
       <button onClick={() => updateAlignment('left')} className={`p-1.5 rounded-md hover:bg-slate-700 ${activeAlign === 'left' ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`} title="Align Left"><AlignLeft size={16} /></button>
       <button onClick={() => updateAlignment('center')} className={`p-1.5 rounded-md hover:bg-slate-700 ${activeAlign === 'center' ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`} title="Align Center"><AlignCenter size={16} /></button>
       <button onClick={() => updateAlignment('right')} className={`p-1.5 rounded-md hover:bg-slate-700 ${activeAlign === 'right' ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`} title="Align Right"><AlignRight size={16} /></button>
       <div className="w-px h-4 bg-slate-700 mx-1" />
       <button onClick={onEdit} className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
         <Edit3 size={14} /> Edit
       </button>
       <div className="w-px h-4 bg-slate-700 mx-1" />
       <button onClick={() => editor.chain().focus().deleteSelection().run()} className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
    </div>
  );
};

const FloatingLinkMenu: React.FC<{ editor: any }> = ({ editor }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [href, setHref] = useState('');

  useEffect(() => {
    const update = () => {
      if (!editor) return;
      if (editor.isActive('link')) {
        const { from, to } = editor.state.selection;
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const editorRect = editor.view.dom.getBoundingClientRect();
        setCoords({ top: end.bottom - editorRect.top + 10, left: start.left - editorRect.left + (end.left - start.left) / 2 });
        setHref(editor.getAttributes('link').href);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    editor.on('selectionUpdate', update);
    editor.on('blur', () => setIsVisible(false));
    return () => { editor.off('selectionUpdate', update); editor.off('blur', () => setIsVisible(false)); };
  }, [editor]);

  if (!isVisible) return null;
  return (
    <div className="absolute z-40 flex items-center gap-2 bg-slate-900 text-white rounded-lg shadow-lg p-2 text-xs transform -translate-x-1/2 animate-in fade-in zoom-in-95 duration-200" style={{ top: `${coords.top}px`, left: `${coords.left}px` }}>
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline max-w-[200px] truncate px-1">
        <ExternalLink size={12} /> {href}
      </a>
      <div className="w-px h-4 bg-slate-700" />
      <button onClick={() => (editor.chain().focus().extendMarkRange('link') as any).unsetLink().run()} className="p-1 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded transition-colors" title="Remove Link"><Link2Off size={14}/></button>
    </div>
  );
};

const ImageEditModal: React.FC<{ isOpen: boolean; onClose: () => void; editor: any }> = ({ isOpen, onClose, editor }) => {
  if (!isOpen || !editor) return null;
  const attrs = editor.getAttributes('image');
  const [width, setWidth] = useState(attrs.width || '100%');
  const [alt, setAlt] = useState(attrs.alt || '');
  const [alignment, setAlignment] = useState(attrs.alignment || 'center');
  const [isWrapped, setIsWrapped] = useState(attrs.isWrapped || false);
  const [margins, setMargins] = useState({ top: attrs.marginTop || 0, right: attrs.marginRight || 0, bottom: attrs.marginBottom || 16, left: attrs.marginLeft || 0 });

  useEffect(() => { if (isOpen) { const cur = editor.getAttributes('image'); setWidth(cur.width || '100%'); setAlt(cur.alt || ''); setAlignment(cur.alignment || 'center'); setIsWrapped(cur.isWrapped || false); setMargins({ top: cur.marginTop || 0, right: cur.marginRight || 0, bottom: cur.marginBottom || 16, left: cur.marginLeft || 0 }); } }, [isOpen, editor]);

  const handleSave = () => { editor.chain().focus().updateAttributes('image', { width, alt, alignment, isWrapped, marginTop: Number(margins.top), marginRight: Number(margins.right), marginBottom: Number(margins.bottom), marginLeft: Number(margins.left) }).run(); onClose(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Image Settings</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Width</label>
              <select value={width} onChange={(e) => setWidth(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                <option value="100%">Original (100%)</option>
                {['25%', '50%', '75%', '100%', '200px', '400px', '600px', '800px'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Alt Text</label>
              <input type="text" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe image..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Alignment</label>
              <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                {[{ id: 'left', icon: <AlignLeft size={16} /> }, { id: 'center', icon: <AlignCenter size={16} /> }, { id: 'right', icon: <AlignRight size={16} /> }].map((opt) => (
                  <button key={opt.id} onClick={() => setAlignment(opt.id)} className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${alignment === opt.id ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}>{opt.icon}</button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input type="checkbox" checked={isWrapped} onChange={(e) => setIsWrapped(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              <span className="text-sm font-medium text-slate-700">Wrap Text</span>
            </label>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2"><Columns size={14} /> Spacing (px)</h4>
            <div className="grid grid-cols-3 gap-3 items-center justify-items-center">
              <div className="col-start-2"><input type="number" value={margins.top} onChange={(e) => setMargins({...margins, top: Number(e.target.value)})} className="w-full text-center border border-slate-200 rounded py-1.5 text-sm"/></div>
              <div className="col-start-1 row-start-2"><input type="number" value={margins.left} onChange={(e) => setMargins({...margins, left: Number(e.target.value)})} className="w-full text-center border border-slate-200 rounded py-1.5 text-sm"/></div>
              <div className="col-start-3 row-start-2"><input type="number" value={margins.right} onChange={(e) => setMargins({...margins, right: Number(e.target.value)})} className="w-full text-center border border-slate-200 rounded py-1.5 text-sm"/></div>
              <div className="col-start-2 row-start-3"><input type="number" value={margins.bottom} onChange={(e) => setMargins({...margins, bottom: Number(e.target.value)})} className="w-full text-center border border-slate-200 rounded py-1.5 text-sm"/></div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button onClick={() => { editor.chain().focus().deleteSelection().run(); onClose(); }} className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center gap-2"><Trash2 size={16} /> Remove</button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TiptapEditor: React.FC<{ content: string; onChange: (html: string) => void }> = ({ content, onChange }) => {
  const [isCodeView, setIsCodeView] = useState(false);
  const [codeContent, setCodeContent] = useState(content);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDropSuccess, setIsDropSuccess] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, history: { depth: 100 } }),
      Underline, TextStyle, Color, FontFamily, Gapcursor, Dropcursor,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
      Image.extend({
        addAttributes() { 
          return { 
            ...this.parent?.(), 
            width: { 
              default: '100%',
              parseHTML: (element) => element.style.width || element.getAttribute('width'),
            }, 
            height: { 
              default: 'auto',
              parseHTML: (element) => element.style.height || element.getAttribute('height'),
            }, 
            alt: { default: '' }, 
            alignment: { 
              default: 'center',
              parseHTML: (element) => {
                const { style } = element;
                if (style.float === 'left') return 'left';
                if (style.float === 'right') return 'right';
                if (style.marginLeft === 'auto' && style.marginRight === 'auto') return 'center';
                if (style.marginLeft === 'auto') return 'right';
                if (style.marginRight === 'auto') return 'left';
                return 'center';
              },
            }, 
            isWrapped: { 
              default: false,
              parseHTML: (element) => {
                const { style } = element;
                return style.float === 'left' || style.float === 'right';
              }
            }, 
            marginTop: { default: 0, parseHTML: (el) => parseInt(el.style.marginTop, 10) || 0 }, 
            marginRight: { default: 0, parseHTML: (el) => parseInt(el.style.marginRight, 10) || 0 }, 
            marginBottom: { default: 16, parseHTML: (el) => parseInt(el.style.marginBottom, 10) || 16 }, 
            marginLeft: { default: 0, parseHTML: (el) => parseInt(el.style.marginLeft, 10) || 0 } 
          }; 
        },
        addNodeView() { return ReactNodeViewRenderer(ImageNodeView); },
        renderHTML({ HTMLAttributes }) {
          const { width, alignment, isWrapped, marginTop, marginRight, marginBottom, marginLeft, style, ...attrs } = HTMLAttributes;
          let styleStr = `width: ${width}; margin-top: ${marginTop}px; margin-bottom: ${marginBottom}px;`;
          if (alignment === 'center') { styleStr += ' display: block; margin-left: auto; margin-right: auto;'; }
          else if (isWrapped) { styleStr += ` float: ${alignment}; display: inline-block; margin-${alignment === 'left' ? 'right' : 'left'}: ${alignment === 'left' ? marginRight || 16 : marginLeft || 16}px; margin-${alignment}: ${alignment === 'left' ? marginLeft : marginRight}px;`; }
          else { styleStr += ` display: block; float: none; margin-${alignment === 'left' ? 'right' : 'auto'}: auto; margin-${alignment}: ${alignment === 'left' ? marginLeft : marginRight}px;`; }
          return ['img', { ...attrs, style: styleStr }];
        }
      }).configure({ inline: true, allowBase64: true }),
      Youtube.configure({ controls: true }), 
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'text-blue-600 hover:underline cursor-pointer decoration-blue-300', target: '_blank' } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse table-fixed w-full' } }), TableRow, TableHeader, TableCell, Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: content,
    onUpdate: ({ editor }) => { if (!isCodeView) { const html = editor.getHTML(); onChange(html); setCodeContent(html); } },
    editorProps: {
      attributes: { class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px] px-12 py-10 font-sans text-slate-700 leading-loose' },
      handleDoubleClick: (view, pos, event) => { if ((view.state.selection as any).node?.type.name === 'image') { setIsImageModalOpen(true); return true; } return false; },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const img = Array.from(event.dataTransfer.files).find(f => /image/i.test(f.type));
          if (img) { 
            event.preventDefault(); 
            const r = new FileReader(); 
            r.onload = (e) => { if (e.target?.result) { const tr = view.state.tr.insert(view.posAtCoords({ left: event.clientX, top: event.clientY })!.pos, view.state.schema.nodes.image.create({ src: e.target.result })); view.dispatch(tr); setIsDropSuccess(true); setTimeout(() => { setIsDropSuccess(false); setIsDragActive(false); }, 1500); } }; 
            r.readAsDataURL(img); return true; 
          }
        }
        setIsDragActive(false); return false;
      },
      handleDOMEvents: { dragenter: (v,e) => { e.preventDefault(); setIsDragActive(true); return false; }, dragover: (v,e) => { e.preventDefault(); setIsDragActive(true); return false; }, dragleave: (v,e) => { if (!(e.relatedTarget as HTMLElement)?.closest('.ProseMirror')) setIsDragActive(false); return false; }, drop: () => { if (!isDropSuccess) setIsDragActive(false); return false; } }
    },
  });

  useEffect(() => { if (editor && content !== editor.getHTML() && Math.abs(content.length - editor.getHTML().length) > 5) { editor.commands.setContent(content); setCodeContent(content); } }, [content, editor]);
  const toggleCodeView = () => { if (isCodeView) { editor?.commands.setContent(codeContent); onChange(codeContent); } else { setCodeContent(prettifyHTML(editor?.getHTML() || '')); } setIsCodeView(!isCodeView); };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col relative group overflow-visible border border-slate-100">
      <div className="sticky top-[69px] z-30 bg-white rounded-t-2xl border-b border-slate-100 shadow-sm"><MenuBar editor={editor} isCodeView={isCodeView} toggleCodeView={toggleCodeView} onEditImage={() => setIsImageModalOpen(true)} /></div>
      <div className="flex-grow bg-white relative cursor-text min-h-[600px] z-0 rounded-b-2xl">
        <style>{`
          .ProseMirror h1 { font-weight: 800; color: #0f172a; letter-spacing: -0.03em; margin-top: 2em; }
          .ProseMirror h2 { font-weight: 700; color: #1e293b; letter-spacing: -0.02em; margin-top: 1.75em; padding-bottom: 0.5em; border-bottom: 1px solid #f1f5f9; }
          .ProseMirror h3 { font-weight: 600; color: #334155; margin-top: 1.5em; }
          .ProseMirror p { margin-bottom: 1.5em; line-height: 1.8; color: #334155; font-size: 1.05rem; }
          .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin-bottom: 1.5em; }
          .ProseMirror ul li { list-style-type: disc; marker: #94a3b8; }
          .ProseMirror blockquote { border-left: 3px solid #3b82f6; background: #f8fafc; padding: 1rem 1.5rem; font-style: italic; color: #475569; margin: 1.5em 0; }
          .ProseMirror table { border-collapse: collapse; width: 100%; margin: 2em 0; border-radius: 0.5rem; overflow: hidden; border: 1px solid #e2e8f0; }
          .ProseMirror th { background-color: #f8fafc; font-weight: 600; text-align: left; color: #475569; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; }
          .ProseMirror td { padding: 0.75rem 1rem; border: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
          .ProseMirror .selectedCell:after { background: rgba(59, 130, 246, 0.08); pointer-events: none; content: ""; position: absolute; inset: 0; z-index: 2; }
        `}</style>
        {isCodeView ? <div className="absolute inset-0"><CodeEditor value={codeContent} onChange={(v) => { setCodeContent(v); onChange(v); }} /></div> : (
          <div onClick={() => editor?.chain().focus().run()} className="relative h-full">
            <EditorContent editor={editor} />
            {(isDragActive || isDropSuccess) && (
               <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 rounded-b-2xl backdrop-blur-sm ${isDropSuccess ? 'bg-emerald-50/80 border-2 border-emerald-500' : 'bg-blue-50/80 border-2 border-dashed border-blue-400'}`}>
                 {isDropSuccess ? <CheckCircle2 size={64} className="text-emerald-600 animate-bounce" /> : <UploadCloud size={64} className="text-blue-500 animate-pulse" />}
               </div>
            )}
            <FloatingImageMenu editor={editor} onEdit={() => setIsImageModalOpen(true)} />
            <FloatingLinkMenu editor={editor} />
          </div>
        )}
      </div>
      <ImageEditModal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} editor={editor} />
    </div>
  );
};

export default TiptapEditor;