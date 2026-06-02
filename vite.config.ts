import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { loadKnowledgeBase, loadPosts } from './src/content/build';

const virtualPostsId = 'virtual:posts';
const resolvedVirtualPostsId = `\0${virtualPostsId}`;
const virtualKnowledgeBaseId = 'virtual:knowledge-base';
const resolvedVirtualKnowledgeBaseId = `\0${virtualKnowledgeBaseId}`;

function markdownPostsPlugin(): Plugin {
  return {
    name: 'markdown-posts',
    resolveId(id) {
      if (id === virtualPostsId) {
        return resolvedVirtualPostsId;
      }
      if (id === virtualKnowledgeBaseId) {
        return resolvedVirtualKnowledgeBaseId;
      }
      return null;
    },
    async load(id) {
      if (id === resolvedVirtualPostsId) {
        const posts = await loadPosts(resolve(process.cwd(), 'content/posts'));
        return `const posts = ${JSON.stringify(posts)};\nexport default posts;\n`;
      }
      if (id === resolvedVirtualKnowledgeBaseId) {
        const entries = await loadKnowledgeBase(resolve(process.cwd(), 'content/kb'));
        return `const entries = ${JSON.stringify(entries)};\nexport default entries;\n`;
      }
      return null;
    },
    configureServer(server) {
      const postsDir = resolve(process.cwd(), 'content/posts');
      const kbDir = resolve(process.cwd(), 'content/kb');
      server.watcher.add(postsDir);
      server.watcher.add(kbDir);
      server.watcher.on('all', (_event, changedPath) => {
        if (!changedPath.includes(postsDir) && !changedPath.includes(kbDir)) {
          return;
        }
        for (const id of [resolvedVirtualPostsId, resolvedVirtualKnowledgeBaseId]) {
          const mod = server.moduleGraph.getModuleById(id);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
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
