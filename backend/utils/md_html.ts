import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import matter from 'gray-matter';
import hljs from 'highlight.js';

const marked = new Marked(
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code: string, lang: string) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
    }),
    { gfm: true, breaks: true },
);

/**
 * @param markdown 原始文本（含 frontmatter）
 */
export const renderMarkdown = async (markdown: string) => {
    if (!markdown) return '';

    // 剥离 frontmatter
    const { content } = matter(markdown);

    // 异步解析
    return await marked.parse(content);
};