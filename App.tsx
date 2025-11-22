import React, { useState, useEffect, useRef } from 'react';
import TiptapEditor from './components/TiptapEditor';
import Sidebar from './components/Sidebar';
import { BlogPost } from './types';
import { ArrowLeft, Save, Eye, X, Monitor, Smartphone, Tablet as TabletIcon } from 'lucide-react';

const PreviewModal: React.FC<{ isOpen: boolean; onClose: () => void; post: BlogPost }> = ({ isOpen, onClose, post }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Construct the full HTML document for the iframe
  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>${post.title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@300;400;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
      <style>
        body { font-family: 'Inter', sans-serif; background-color: white; margin: 0; padding: 0; overflow-x: hidden; }
        
        /* Responsive Prose Configuration */
        .prose { max-width: none; color: #334155; font-size: 16px; line-height: 1.6; }
        @media (min-width: 768px) {
          .prose { font-size: 18px; line-height: 1.8; }
        }

        .prose h1, .prose h2, .prose h3 { color: #0f172a; letter-spacing: -0.02em; }
        .prose p { margin-bottom: 1.5em; }
        .prose img { border-radius: 0.75rem; display: block; width: 100%; height: auto; }
        
        /* Table Styling */
        .prose table { width: 100%; border-collapse: collapse; margin: 2em 0; font-size: 0.9em; }
        .prose th { background-color: #f8fafc; text-align: left; padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; }
        .prose td { padding: 8px 12px; border: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
        
        /* Custom Image Classes from Editor */
        img[style*="float: left"] { margin-right: 16px; margin-bottom: 12px; max-width: 50%; }
        img[style*="float: right"] { margin-left: 16px; margin-bottom: 12px; max-width: 50%; }
        
        /* Mobile Optimizations */
        @media (max-width: 640px) {
          .prose h1 { font-size: 1.75em; line-height: 1.3; margin-top: 1.5em; }
          .prose h2 { font-size: 1.5em; margin-top: 1.5em; }
          .prose h3 { font-size: 1.25em; }
          .header-title { font-size: 2rem !important; line-height: 1.2 !important; }
          .container-padding { padding: 2rem 1.25rem !important; }
          
          /* Reset floats on very small screens for better readability */
          img[style*="float: left"], img[style*="float: right"] { 
             float: none !important; 
             margin: 1.5em 0 !important; 
             max-width: 100% !important; 
          }
        }

        /* Hide Scrollbar for clean look */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      </style>
    </head>
    <body class="antialiased">
      <div class="max-w-3xl mx-auto container-padding" style="padding: 3rem 2rem;">
        <header class="mb-8 text-center">
           <div class="flex items-center justify-center gap-2 text-xs text-slate-500 mb-4 font-medium uppercase tracking-wider">
             <span>${post.publishDate.split('at')[0]}</span>
             <span>•</span>
             <span>${post.author}</span>
           </div>
           <h1 class="header-title text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
             ${post.title}
           </h1>
           ${post.featuredImage ? `
             <div class="relative w-full rounded-xl overflow-hidden shadow-lg mb-8 aspect-video">
               <img src="${post.featuredImage}" alt="${post.title}" class="w-full h-full object-cover" style="margin:0;">
             </div>
           ` : ''}
        </header>
        <article class="prose md:prose-lg prose-slate prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-700">
          ${post.content}
        </article>
        <footer class="mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-xs">
          <p>© 2025 Your Brand. All rights reserved.</p>
        </footer>
      </div>
    </body>
    </html>
  `;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex flex-col">
      {/* Top Control Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 text-white shadow-md z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-slate-200 tracking-wide hidden sm:block">Preview Mode</h2>
          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{device} View</span>
        </div>

        {/* Device Toggles */}
        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
          <button 
            onClick={() => setDevice('desktop')}
            className={`p-2 rounded-md transition-all ${device === 'desktop' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            title="Desktop"
          >
            <Monitor size={18} />
          </button>
          <button 
            onClick={() => setDevice('tablet')}
            className={`p-2 rounded-md transition-all ${device === 'tablet' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            title="Tablet"
          >
            <TabletIcon size={18} />
          </button>
          <button 
            onClick={() => setDevice('mobile')}
            className={`p-2 rounded-md transition-all ${device === 'mobile' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            title="Mobile"
          >
            <Smartphone size={18} />
          </button>
        </div>

        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={18} /> <span className="hidden sm:inline">Close</span>
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-[#020617] relative p-4 sm:p-8">
        <div 
          className={`
            relative bg-white shadow-2xl transition-all duration-500 ease-in-out overflow-hidden transform origin-center
            ${device === 'desktop' ? 'w-full h-full max-w-[1200px] rounded-lg' : ''}
            ${device === 'tablet' ? 'w-[768px] h-[95%] rounded-[24px] border-[12px] border-[#1e293b] shadow-[0_0_0_2px_#0f172a]' : ''}
            ${device === 'mobile' ? 'w-[375px] h-[95%] rounded-[40px] border-[14px] border-[#1e293b] shadow-[0_0_0_2px_#0f172a]' : ''}
          `}
        >
           {/* Camera Notch for Mobile/Tablet visual flair */}
           {(device === 'mobile' || device === 'tablet') && (
             <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-[#1e293b] rounded-b-xl z-20 flex justify-center">
                <div className="w-12 h-1.5 bg-slate-800 rounded-full mt-2"></div>
             </div>
           )}

           {/* Screen Glare effect */}
           {(device === 'mobile' || device === 'tablet') && (
             <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none z-30"></div>
           )}

           <iframe 
             ref={iframeRef}
             srcDoc={iframeContent}
             title="Preview"
             className="w-full h-full bg-white border-none"
             sandbox="allow-same-origin allow-scripts"
           />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [post, setPost] = useState<BlogPost>({
    id: '1',
    title: "The Ultimate Guide to Men's Shoe Care",
    content: `
      <p>Your shoes are the foundation of your outfit, and keeping them in pristine condition speaks volumes about your attention to detail. Whether you're rocking leather oxfords or fresh sneakers, a consistent care routine is essential.</p>
      
      <h2>Why Routine Care Matters</h2>
      <p>Regular maintenance not only extends the life of your footwear but also ensures they always look their best. Dirt, moisture, and neglect are the biggest enemies of your shoe collection.</p>
      
      <h3>Quick Comparison: Do's and Don'ts</h3>
      <table>
        <tbody>
          <tr>
            <th colspan="1" rowspan="1"><p>Do's</p></th>
            <th colspan="1" rowspan="1"><p>Why It Matters</p></th>
            <th colspan="1" rowspan="1"><p>Don'ts</p></th>
            <th colspan="1" rowspan="1"><p>Why to Avoid</p></th>
          </tr>
          <tr>
            <td colspan="1" rowspan="1"><p>Clean regularly</p></td>
            <td colspan="1" rowspan="1"><p>Prevents stains</p></td>
            <td colspan="1" rowspan="1"><p>Ignore wet shoes</p></td>
            <td colspan="1" rowspan="1"><p>Causes mold</p></td>
          </tr>
          <tr>
            <td colspan="1" rowspan="1"><p>Use shoe trees</p></td>
            <td colspan="1" rowspan="1"><p>Maintains shape</p></td>
            <td colspan="1" rowspan="1"><p>Machine wash</p></td>
            <td colspan="1" rowspan="1"><p>Damages glue</p></td>
          </tr>
        </tbody>
      </table>
      
      <h2>Essential Tools</h2>
      <ul>
        <li>Horsehair brush</li>
        <li>Quality shoe polish or cream</li>
        <li>Waterproofing spray</li>
      </ul>
      
      <p>Invest in these tools today to save money on replacements tomorrow.</p>
    `,
    status: 'visible',
    publishDate: 'Nov 17, 2025 at 4:31 pm IST',
    author: 'John Doe',
    featuredImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop',
    seoDescription: "Learn the essential do's and don'ts of men's shoe care. Discover tips on cleaning, storage, and tools to keep your footwear in pristine condition.",
    keywords: ["shoes", "leather care", "men's fashion", "cleaning guide"]
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const updatePost = (updates: Partial<BlogPost>) => {
    setPost(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 transition-all shadow-sm">
        <div className="flex items-center gap-4">
          <button className="p-2 -ml-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all duration-200">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
               <h1 className="text-sm font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-md tracking-tight">
                 {post.title || 'Untitled Post'}
               </h1>
               <span className={`w-2 h-2 rounded-full ${post.status === 'visible' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-sm`}></span>
             </div>
             <span className="text-[11px] font-medium text-slate-400">{post.status === 'visible' ? 'Published' : 'Draft'} &bull; Last saved just now</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-md transition-colors border border-transparent hover:border-slate-200"
          >
            <Eye size={14} /> Preview
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          <button className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 active:scale-95">
            <Save size={16} /> Save
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Editor (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            
            {/* Title Field */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-8 transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
              <label htmlFor="postTitle" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Post Title</label>
              <input
                type="text"
                id="postTitle"
                value={post.title}
                onChange={(e) => updatePost({ title: e.target.value })}
                placeholder="Enter a catchy title..."
                className="w-full text-3xl font-bold text-slate-900 placeholder-slate-300 bg-transparent border-none p-0 focus:ring-0 transition-all outline-none"
              />
            </div>

            {/* Rich Text Editor */}
            <div className="flex flex-col">
               <div className="flex items-center justify-between mb-2 px-2">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Content</label>
                 <span className="text-xs text-slate-400 font-medium">Markdown supported</span>
               </div>
               <TiptapEditor 
                 content={post.content} 
                 onChange={(html) => updatePost({ content: html })}
               />
            </div>

          </div>

          {/* Right: Sidebar (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <Sidebar post={post} updatePost={updatePost} />
            </div>
          </div>

        </div>
      </main>
      
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} post={post} />
    </div>
  );
};

export default App;