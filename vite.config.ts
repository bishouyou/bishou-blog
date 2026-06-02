import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { loadPosts } from './src/content/build';

const virtualPostsId = 'virtual:posts';
const resolvedVirtualPostsId = `\0${virtualPostsId}`;

function markdownPostsPlugin(): Plugin {
  return {
    name: 'markdown-posts',
    resolveId(id) {
      if (id === virtualPostsId) {
        return resolvedVirtualPostsId;
      }
      return null;
    },
    async load(id) {
      if (id !== resolvedVirtualPostsId) {
        return null;
      }

      const posts = await loadPosts(resolve(process.cwd(), 'content/posts'));
      return `const posts = ${JSON.stringify(posts)};\nexport default posts;\n`;
    },
    configureServer(server) {
      const postsDir = resolve(process.cwd(), 'content/posts');
      server.watcher.add(postsDir);
      server.watcher.on('all', (_event, changedPath) => {
        if (!changedPath.includes(postsDir)) {
          return;
        }
        const mod = server.moduleGraph.getModuleById(resolvedVirtualPostsId);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: 'full-reload' });
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [markdownPostsPlugin()]
});
