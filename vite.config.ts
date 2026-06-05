import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { isContentImagePath, loadKnowledgeBase, loadPosts, prepareContentAssets } from './src/content/build';

const virtualPostsId = 'virtual:posts';
const resolvedVirtualPostsId = `\0${virtualPostsId}`;
const virtualKnowledgeBaseId = 'virtual:knowledge-base';
const resolvedVirtualKnowledgeBaseId = `\0${virtualKnowledgeBaseId}`;

function markdownPostsPlugin(): Plugin {
  const projectRoot = process.cwd();
  let assetIndexPromise: ReturnType<typeof prepareContentAssets> | undefined;
  const loadAssetIndex = () => {
    assetIndexPromise ??= prepareContentAssets(projectRoot);
    return assetIndexPromise;
  };
  const invalidateAssetIndex = () => {
    assetIndexPromise = undefined;
  };

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
        const assetIndex = await loadAssetIndex();
        const posts = await loadPosts(resolve(projectRoot, 'content/posts'), { assetIndex, projectRoot });
        return `const posts = ${JSON.stringify(posts)};\nexport default posts;\n`;
      }
      if (id === resolvedVirtualKnowledgeBaseId) {
        const assetIndex = await loadAssetIndex();
        const entries = await loadKnowledgeBase(resolve(projectRoot, 'content/kb'), { assetIndex, projectRoot });
        return `const entries = ${JSON.stringify(entries)};\nexport default entries;\n`;
      }
      return null;
    },
    configureServer(server) {
      const postsDir = resolve(projectRoot, 'content/posts');
      const kbDir = resolve(projectRoot, 'content/kb');
      server.watcher.add(postsDir);
      server.watcher.add(kbDir);
      server.watcher.on('all', (_event, changedPath) => {
        const markdownChanged = changedPath.includes(postsDir) || changedPath.includes(kbDir);
        const imageChanged = isContentImagePath(changedPath);
        if (!markdownChanged && !imageChanged) {
          return;
        }
        if (imageChanged) {
          invalidateAssetIndex();
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
