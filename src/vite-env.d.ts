/// <reference types="vite/client" />

declare module 'virtual:posts' {
  import type { Post } from './content/types';

  const posts: Post[];
  export default posts;
}

declare module 'virtual:knowledge-base' {
  import type { KnowledgeBaseEntry } from './content/types';

  const entries: KnowledgeBaseEntry[];
  export default entries;
}

declare module 'jquery.terminal/js/jquery.terminal.min.js';
declare module 'jquery.terminal/css/jquery.terminal.min.css';

interface JQuery {
  terminal(
    interpreter: (command: string, terminal: any) => void | Promise<void>,
    options?: Record<string, unknown>
  ): JQuery;
}
