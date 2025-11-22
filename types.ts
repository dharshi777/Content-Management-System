export interface BlogPost {
  id: string;
  title: string;
  content: string;
  status: 'visible' | 'hidden';
  publishDate: string;
  author: string;
  featuredImage: string | null;
  seoDescription?: string;
  keywords?: string[];
}

export enum EditorActionType {
  BOLD = 'bold',
  ITALIC = 'italic',
  UNDERLINE = 'underline',
  STRIKE = 'strike',
  H1 = 'h1',
  H2 = 'h2',
  BULLET_LIST = 'bulletList',
  ORDERED_LIST = 'orderedList',
  BLOCKQUOTE = 'blockquote',
  IMAGE = 'image',
  LINK = 'link',
  TABLE = 'table',
  AI_GENERATE = 'ai_generate'
}