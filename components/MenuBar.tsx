import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon, 
  Table as TableIcon, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Code, Check, Eraser, X,
  Type, Video,
  Trash2, ArrowDownToLine, ArrowUpToLine, ArrowLeftToLine, ArrowRightToLine,
  Merge, Split, LayoutTemplate, UploadCloud, ChevronDown
} from 'lucide-react';

interface MenuBarProps {
  editor: Editor | null;
  isCodeView: boolean;
  toggleCodeView: () => void;
  onEditImage?: () => void;
}

const GOOGLE_FONTS = [
  { name: 'Default Font', value: '', family: 'Inter' },
  { name: 'Inter', value: 'Inter, sans-serif', family: 'Inter' },
  { name: 'Roboto', value: 'Roboto, sans-serif', family: 'Roboto' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif', family: 'Open Sans' },
  { name: 'Lato', value: 'Lato, sans-serif', family: 'Lato' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', family: 'Montserrat' },
  { name: 'Oswald', value: 'Oswald, sans-serif', family: 'Oswald' },
  { name: 'Merriweather', value: 'Merriweather, serif', family: 'Merriweather' },
  { name: 'Playfair Display', value: '"Playfair Display", serif', family: 'Playfair Display' },
  { name: 'Lora', value: 'Lora, serif', family: 'Lora' },
  { name: 'Poppins', value: 'Poppins, sans-serif', family: 'Poppins' },
];

const MenuBar: React.FC<MenuBarProps> = ({ 
  editor, 
  isCodeView, 
  toggleCodeView,
  onEditImage
}) => {
  const [activeInput, setActiveInput] = useState<'link' | 'image' | 'video' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      forceUpdate(prev => prev + 1);
      if (editor.isActive('textStyle')) {
         setTextColor(editor.getAttributes('textStyle').color || '#000000');
      }
    };
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);
    editor.on('update', handleUpdate);
    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  // Reset active inputs when switching to code view
  useEffect(() => {
    if (isCodeView) {
      setActiveInput(null);
      setInputValue('');
      setIsFontDropdownOpen(false);
    }
  }, [isCodeView]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (isFontDropdownOpen && !target.closest('.font-dropdown-container')) {
        setIsFontDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFontDropdownOpen]);

  if (!editor) return null;

  const toggleTool = (tool: 'link' | 'image' | 'video') => {
    if (activeInput === tool) {
      setActiveInput(null);
      setInputValue('');
    } else {
      setActiveInput(tool);
      if (tool === 'link' && editor.isActive('link')) {
        setInputValue(editor.getAttributes('link').href || '');
      } else {
        setInputValue('');
      }
    }
  };

  const handleInputApply = () => {
    if (!inputValue) {
      if (activeInput === 'link') (editor.chain().focus() as any).unsetLink().run();
      setActiveInput(null);
      return;
    }
    if (activeInput === 'link') {
      if (editor.state.selection.empty) {
         editor.chain().focus().insertContent(`<a href="${inputValue}" target="_blank" class="text-blue-600 hover:underline">${inputValue}</a>`).run();
      } else {
         (editor.chain().focus().extendMarkRange('link') as any).setLink({ href: inputValue, target: '_blank' }).run();
      }
    } else if (activeInput === 'image') {
      (editor.chain().focus() as any).setImage({ src: inputValue }).run();
    } else if (activeInput === 'video') {
      const isYoutube = inputValue.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/);
      const isVimeo = inputValue.match(/^(https?:\/\/)?(www\.)?(vimeo\.com)\/.+$/);
      if (isYoutube || isVimeo) {
        (editor.chain().focus() as any).setYoutubeVideo({ src: inputValue }).run();
      } else {
        editor.chain().focus().insertContent(`<video src="${inputValue}" controls class="w-full rounded-lg shadow-md my-4"></video>`).run();
      }
    }
    setActiveInput(null);
    setInputValue('');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (activeInput === 'image') {
        (editor.chain().focus() as any).setImage({ src }).run();
      } else if (activeInput === 'video') {
        editor.chain().focus().insertContent(`<video src="${src}" controls class="w-full rounded-lg shadow-md my-4"></video>`).run();
      }
      setActiveInput(null);
      setInputValue('');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFontSelect = (fontValue: string) => {
    if (fontValue === '') {
      (editor.chain().focus() as any).unsetFontFamily().run();
    } else {
      (editor.chain().focus() as any).setFontFamily(fontValue).run();
    }
    setIsFontDropdownOpen(false);
  };

  const getCurrentFontName = () => {
    const currentFont = editor.getAttributes('textStyle').fontFamily;
    if (!currentFont) return 'Default Font';
    const fontObj = GOOGLE_FONTS.find(f => f.value === currentFont || currentFont.includes(f.family));
    return fontObj ? fontObj.name : 'Custom Font';
  };

  const Button = ({ onClick, isActive = false, disabled = false, icon: Icon, title, className = '', label }: any) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); !disabled && onClick(); }}
      disabled={disabled}
      className={`
        h-9 min-w-[36px] px-2 flex items-center justify-center rounded-md transition-all duration-200 border border-transparent
        ${isActive 
          ? 'bg-slate-900 text-white shadow-sm' 
          : disabled 
            ? 'text-slate-300 cursor-not-allowed' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }
        ${className}
      `}
      title={title || label}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {label && <span className="ml-1.5 text-xs font-medium">{label}</span>}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-slate-200 mx-1.5 my-auto" />;

  const isTableActive = editor.isActive('table');
  const isImageActive = editor.isActive('image');

  return (
    <div className="flex flex-col bg-white border-b border-slate-100 select-none z-50">
      {/* --- TOP ROW (Visual Tools) --- */}
      <div className={`flex flex-wrap items-center gap-0.5 p-1.5 bg-white relative z-20 ${isCodeView ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <Button icon={Undo} onClick={() => (editor.chain().focus() as any).undo().run()} disabled={!(editor.can() as any).undo() || isCodeView} title="Undo" />
        <Button icon={Redo} onClick={() => (editor.chain().focus() as any).redo().run()} disabled={!(editor.can() as any).redo() || isCodeView} title="Redo" />
        <Divider />
        <Button label="H1" onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} disabled={isCodeView} />
        <Button label="H2" onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} disabled={isCodeView} />
        <Button icon={Type} onClick={() => (editor.chain().focus() as any).setParagraph().run()} isActive={editor.isActive('paragraph')} title="Paragraph" disabled={isCodeView} />
        <Divider />
        
        {/* Font Family Dropdown */}
        <div className="relative font-dropdown-container z-[60]">
          <button 
            onMouseDown={(e) => { e.preventDefault(); !isCodeView && setIsFontDropdownOpen(!isFontDropdownOpen); }}
            disabled={isCodeView}
            className={`h-9 px-3 flex items-center justify-between gap-2 rounded-md border border-slate-200 text-slate-700 text-xs font-medium min-w-[130px] transition-all ${isCodeView ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-slate-300'}`}
          >
            <span className="truncate">{getCurrentFontName()}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>
          
          {isFontDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-[180px] bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden py-1 z-[10000] ring-1 ring-black/5 max-h-[300px] overflow-y-auto custom-scrollbar origin-top-left">
              {GOOGLE_FONTS.map((font) => (
                <button
                  key={font.name}
                  onMouseDown={(e) => { e.preventDefault(); handleFontSelect(font.value); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between group ${getCurrentFontName() === font.name ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                  style={{ fontFamily: font.value || 'inherit' }}
                >
                  <span>{font.name}</span>
                  {getCurrentFontName() === font.name && <Check size={12} className="text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />
        <Button icon={Bold} onClick={() => (editor.chain().focus() as any).toggleBold().run()} isActive={editor.isActive('bold')} disabled={isCodeView} title="Bold" />
        <Button icon={Italic} onClick={() => (editor.chain().focus() as any).toggleItalic().run()} isActive={editor.isActive('italic')} disabled={isCodeView} title="Italic" />
        <Button icon={Underline} onClick={() => (editor.chain().focus() as any).toggleUnderline().run()} isActive={editor.isActive('underline')} disabled={isCodeView} title="Underline" />
        <Button icon={Eraser} onClick={() => editor.chain().focus().unsetAllMarks().run()} disabled={isCodeView} title="Clear Formatting" />
        <Divider />
        <div className={`relative flex items-center justify-center w-9 h-9 ${isCodeView ? 'opacity-50 pointer-events-none' : ''}`}>
           <input 
             ref={colorInputRef} type="color" value={textColor} disabled={isCodeView}
             onChange={(e) => { setTextColor(e.target.value); (editor.chain().focus() as any).setColor(e.target.value).run(); }}
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
           />
           <button className="absolute inset-0 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors z-10 pointer-events-none">
              <div className="flex flex-col items-center justify-center scale-90">
                 <span className="font-serif font-bold text-lg leading-none text-slate-700">A</span>
                 <span className="w-4 h-1 mt-0.5 rounded-full ring-1 ring-black/5" style={{ backgroundColor: textColor }}></span>
              </div>
           </button>
        </div>
        <Divider />
        <Button icon={AlignLeft} onClick={() => editor.isActive('image') ? editor.chain().focus().updateAttributes('image', { alignment: 'left' }).run() : (editor.chain().focus() as any).setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' }) || editor.getAttributes('image')?.alignment === 'left'} disabled={isCodeView} title="Align Left" />
        <Button icon={AlignCenter} onClick={() => editor.isActive('image') ? editor.chain().focus().updateAttributes('image', { alignment: 'center' }).run() : (editor.chain().focus() as any).setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' }) || editor.getAttributes('image')?.alignment === 'center'} disabled={isCodeView} title="Align Center" />
        <Button icon={AlignRight} onClick={() => editor.isActive('image') ? editor.chain().focus().updateAttributes('image', { alignment: 'right' }).run() : (editor.chain().focus() as any).setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' }) || editor.getAttributes('image')?.alignment === 'right'} disabled={isCodeView} title="Align Right" />
        <Button icon={AlignJustify} onClick={() => (editor.chain().focus() as any).setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} disabled={isCodeView || isImageActive} title="Justify" />
        
        <Divider />
        <Button icon={List} onClick={() => (editor.chain().focus() as any).toggleBulletList().run()} isActive={editor.isActive('bulletList')} disabled={isCodeView} title="Bullet List" />
        <Button icon={ListOrdered} onClick={() => (editor.chain().focus() as any).toggleOrderedList().run()} isActive={editor.isActive('orderedList')} disabled={isCodeView} title="Ordered List" />
      </div>

      {/* --- BOTTOM ROW (Contextual Tools + Fixed Code Toggle) --- */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 min-h-[44px] bg-slate-50/80 border-t border-slate-100 transition-all duration-200 z-10">
        
        {/* Left Side: Dynamic Contextual Tools */}
        <div className="flex-1 flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar">
          {isCodeView ? (
            <span className="text-xs font-medium text-slate-400 ml-2 select-none flex items-center gap-2">
              <Code size={14} /> HTML Source Editor
            </span>
          ) : activeInput ? (
            // Input Mode (Link / Image / Video)
            <div className="flex items-center gap-2 w-full">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 w-16 flex-shrink-0">
                 {activeInput === 'link' ? 'Link' : activeInput === 'image' ? 'Image' : 'Video'}
              </span>
              <input 
                type="text" autoFocus value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInputApply()}
                placeholder={activeInput === 'link' ? 'https://' : 'Paste URL...'}
                className="flex-1 h-8 text-sm border border-slate-300 rounded px-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none bg-white shadow-sm min-w-[150px]"
              />
              <Button icon={Check} onClick={handleInputApply} className="bg-slate-900 text-white hover:bg-slate-800 h-8 w-8" title="Apply" />
              {(activeInput === 'image' || activeInput === 'video') && (
                <>
                  <div className="w-px h-4 bg-slate-300 mx-1" />
                  <Button icon={UploadCloud} label="Upload" onClick={handleUploadClick} className="bg-white border border-slate-300 hover:bg-slate-50 h-8" />
                  <input ref={fileInputRef} type="file" accept={activeInput === 'image' ? "image/*" : "video/*"} className="hidden" onChange={handleFileChange} />
                </>
              )}
              <div className="w-px h-4 bg-slate-300 mx-1" />
              <Button icon={X} onClick={() => setActiveInput(null)} className="hover:bg-slate-200 h-8 w-8" title="Cancel" />
            </div>
          ) : (isTableActive && !isImageActive) ? (
            // Table Mode (Only if Image is NOT selected)
            <div className="flex items-center gap-1 w-full">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded uppercase mr-2 whitespace-nowrap">Table</span>
              <Button icon={ArrowLeftToLine} onClick={() => (editor.chain().focus() as any).addColumnBefore().run()} title="Add Col Before" />
              <Button icon={ArrowRightToLine} onClick={() => (editor.chain().focus() as any).addColumnAfter().run()} title="Add Col After" />
              <Button icon={Trash2} onClick={() => (editor.chain().focus() as any).deleteColumn().run()} className="text-red-500 hover:bg-red-50" title="Del Col" />
              <Divider />
              <Button icon={ArrowUpToLine} onClick={() => (editor.chain().focus() as any).addRowBefore().run()} title="Add Row Before" />
              <Button icon={ArrowDownToLine} onClick={() => (editor.chain().focus() as any).addRowAfter().run()} title="Add Row After" />
              <Button icon={Trash2} onClick={() => (editor.chain().focus() as any).deleteRow().run()} className="text-red-500 hover:bg-red-50" title="Del Row" />
              <Divider />
              <Button icon={Merge} onClick={() => (editor.chain().focus() as any).mergeCells().run()} title="Merge" />
              <Button icon={Split} onClick={() => (editor.chain().focus() as any).splitCell().run()} title="Split" />
              <Divider />
              <Button icon={LayoutTemplate} onClick={() => (editor.chain().focus() as any).toggleHeaderRow().run()} isActive={(editor.can() as any).toggleHeaderRow()} title="Header Row" />
              <div className="flex-1" />
              <Button icon={Trash2} onClick={() => (editor.chain().focus() as any).deleteTable().run()} label="Delete Table" className="text-red-600 hover:bg-red-50 bg-red-50/50 h-8 px-3" />
            </div>
          ) : (
            // Default Mode (Standard Tools)
            <div className="flex items-center gap-1 w-full flex-wrap">
               <Button icon={LinkIcon} onClick={() => toggleTool('link')} isActive={activeInput === 'link'} label="Link" />
               <Button icon={ImageIcon} onClick={() => toggleTool('image')} isActive={activeInput === 'image'} label="Image" />
               <Button icon={Video} onClick={() => toggleTool('video')} isActive={activeInput === 'video'} label="Video" />
               <Button icon={TableIcon} onClick={() => (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} label="Table" />
               
               {/* Contextual Edit Buttons */}
               {isImageActive && (
                 <>
                   <div className="w-px h-4 bg-slate-300 mx-2" />
                   <Button icon={ImageIcon} label="Edit Image" onClick={() => onEditImage?.()} className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100" />
                 </>
               )}
            </div>
          )}
        </div>

        {/* Right Side: Fixed Tools */}
        <div className="flex-none pl-2 border-l border-slate-200 ml-2">
             <Button icon={Code} label={isCodeView ? "Visual" : "Code"} onClick={toggleCodeView} isActive={isCodeView} className={isCodeView ? "bg-slate-800 text-white shadow-md hover:bg-slate-700" : ""} />
        </div>

      </div>
    </div>
  );
};
export default MenuBar;