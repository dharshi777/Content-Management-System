import React, { useMemo } from 'react';
import { Calendar, Eye, EyeOff, ChevronDown, Upload, Image as ImageIcon, CheckCircle2, Bot, Search, Code2, X } from 'lucide-react';
import { BlogPost } from '../types';

interface SidebarProps {
  post: BlogPost;
  updatePost: (updates: Partial<BlogPost>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ post, updatePost }) => {
  const Card = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon?: React.ElementType, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    return (
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-200 mb-4">
        <div 
          className="px-5 py-4 flex items-center justify-between cursor-pointer select-none group hover:bg-slate-50/50"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2.5">
            {Icon && <Icon size={16} className="text-slate-500 group-hover:text-blue-600 transition-colors" />}
            <h3 className="text-sm font-bold text-slate-700">{title}</h3>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        {isOpen && <div className="px-5 pb-5 pt-1 border-t border-slate-50">{children}</div>}
      </div>
    );
  };

  const jsonLd = useMemo(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "image": post.featuredImage ? [post.featuredImage] : [],
      "datePublished": post.publishDate,
      "author": [{ "@type": "Person", "name": post.author }],
      "description": post.seoDescription,
      "keywords": post.keywords?.join(", ")
    };
    return JSON.stringify(schema, null, 2);
  }, [post]);

  return (
    <div className="w-full flex flex-col gap-2">
      <Card title="Publishing" defaultOpen={true}>
        <div className="space-y-3">
          <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${post.status === 'visible' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}`}>
            <div className="mt-0.5"><input type="radio" className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" checked={post.status === 'visible'} onChange={() => updatePost({ status: 'visible' })} /></div>
            <div>
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">Published</span>
              <span className="text-xs text-slate-500 block mt-0.5">Visible to everyone.</span>
            </div>
          </label>
          <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${post.status === 'hidden' ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
            <div className="mt-0.5"><input type="radio" className="w-4 h-4 text-amber-600 focus:ring-amber-500" checked={post.status === 'hidden'} onChange={() => updatePost({ status: 'hidden' })} /></div>
            <div>
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">Draft</span>
              <span className="text-xs text-slate-500 block mt-0.5">Work in progress.</span>
            </div>
          </label>
          <div className="pt-2 text-xs text-slate-400 flex items-center gap-1"><Calendar size={12}/> Scheduled for {post.publishDate}</div>
        </div>
      </Card>

      <Card title="SEO & Schema" icon={Bot} defaultOpen={true}>
        <div className="space-y-4">
           <div>
             <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Meta Description</label>
             <textarea 
               rows={3} value={post.seoDescription || ''} onChange={(e) => updatePost({ seoDescription: e.target.value })} 
               className="w-full text-sm border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 border outline-none transition-all resize-none bg-slate-50/30" 
               placeholder="Summary for search engines..."
             />
           </div>
           <div className="bg-slate-900 rounded-lg p-3 overflow-hidden border border-slate-800">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase"><Code2 size={10} className="inline mr-1"/> JSON-LD Preview</span>
                <span className="text-[10px] text-emerald-400">Valid</span>
             </div>
             <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all opacity-80">{jsonLd}</pre>
           </div>
        </div>
      </Card>

      <Card title="Featured Image" icon={ImageIcon}>
        <div className="group relative aspect-video border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer overflow-hidden bg-slate-50/50">
          {post.featuredImage ? (
            <>
              <img src={post.featuredImage} alt="Featured" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full text-slate-800">Change Image</span>
              </div>
              <button className="absolute top-2 right-2 bg-white p-1 rounded-md text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm" onClick={(e) => { e.stopPropagation(); updatePost({ featuredImage: null }); }}><X size={14}/></button>
            </>
          ) : (
            <div className="text-center">
              <ImageIcon className="text-slate-300 mx-auto mb-2" size={24} />
              <span className="text-xs font-medium text-slate-500">Click to upload</span>
            </div>
          )}
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const file = e.target.files?.[0]; if (file) updatePost({ featuredImage: URL.createObjectURL(file) }); }} />
        </div>
      </Card>
    </div>
  );
};
export default Sidebar;