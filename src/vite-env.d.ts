/// <reference types="vite/client" />

declare module 'virtual:posts' {
  import type { Post } from './content/types';

  const posts: Post[];
  export default posts;
}

declare module 'jquery.terminal/js/jquery.terminal.min.js';
declare module 'jquery.terminal/css/jquery.terminal.min.css';

interface JQuery {
  terminal(
    interpreter: (command: string, terminal: any) => void | Promise<void>,
    options?: Record<string, unknown>
  ): JQuery;
}
