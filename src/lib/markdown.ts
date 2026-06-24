import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { THEMES, type ThemeLayout, type ThemeColors } from './themes';

export const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight: function (str, lang) {
        let codeContent = '';
        if (lang && hljs.getLanguage(lang)) {
            try {
                codeContent = hljs.highlight(str, { language: lang }).value;
            } catch (__) {
                codeContent = md.utils.escapeHtml(str);
            }
        } else {
            codeContent = md.utils.escapeHtml(str);
        }

        const dots = '<div style="margin-bottom: 12px; white-space: nowrap;"><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ff5f56; margin-right: 6px;"></span><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; margin-right: 6px;"></span><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #27c93f;"></span></div>';

        return `<pre>${dots}<code class="hljs">${codeContent}</code></pre>`;
    }
});

// Avoid bold fragmentation when pasting from certain apps
export function preprocessMarkdown(content: string) {
    content = content.replace(/^[ ]{0,3}(\*[ ]*\*[ ]*\*[\* ]*)[ \t]*$/gm, '***');
    content = content.replace(/^[ ]{0,3}(-[ ]*-[ ]*-[- ]*)[ \t]*$/gm, '---');
    content = content.replace(/^[ ]{0,3}(_[ ]*_[ ]*_[_ ]*)[ \t]*$/gm, '___');
    content = content.replace(/\*\*[ \t]+\*\*/g, ' ');
    content = content.replace(/\*{4,}/g, '');
    // markdown-it may fail to open bold when content starts with punctuation/symbol
    // and `**` is attached directly to preceding text (e.g. `至**-5%**。`).
    // Insert a zero-width separator only inside opening `**...` for these cases.
    content = content.replace(
        /([^\s])\*\*([+\-＋－%％~～!！?？,，.。:：;；、\\/|@#￥$^&*_=（）()【】\[\]《》〈〉「」『』“”"'`…·][^\n*]*?)\*\*/g,
        '$1**\u200B$2**'
    );
    return content;
}

/**
 * Apply layout transformations to the DOM when a theme has layout rules.
 * Creates structural DOM changes (wrap elements, add decorators, transform sections)
 * so that each theme has a truly distinct visual identity — not just color changes.
 */
function applyLayoutTransform(doc: Document, layout: ThemeLayout, colors: ThemeColors) {
    const s = layout.spacing;
    const pad = s.contentPadding || { left: 25, right: 25 };

    // ═══════════════════════════════════════════════
    // H1 — 3 decoration styles
    // ═══════════════════════════════════════════════

    doc.querySelectorAll('h1').forEach(h1 => {
        const decor = layout.h1.decor || 'none';

        if (decor === 'color-block') {
            // ▸ Full-width background card with generous padding
            const card = doc.createElement('div');
            const accent = layout.h1.decorColor || colors.accent;
            const bg = layout.h1.decorBg || colors.accent + '15';
            card.setAttribute('style', [
                `background-color: ${bg}`,
                `padding: 40px 32px 36px 32px`,
                `margin: ${s.sectionGap + 8}px 0 ${s.sectionGap}px 0`,
                `text-align: ${layout.h1.align || 'left'}`,
                `position: relative`,
            ].join('; '));
            // Accent top bar
            const bar = doc.createElement('div');
            bar.setAttribute('style', `position: absolute; top: 0; left: 0; right: 0; height: 4px; background-color: ${accent};`);
            card.appendChild(bar);
            h1.parentNode?.insertBefore(card, h1);
            card.appendChild(h1);
            h1.setAttribute('style', (h1.getAttribute('style') || '') + '; margin: 0 !important; padding: 0 !important; border: none !important;');
        } else if (decor === 'left-bar') {
            const color = layout.h1.decorColor || colors.accent;
            const w = layout.h1.decorWidth || 5;
            const cur = h1.getAttribute('style') || '';
            h1.setAttribute('style', `${cur}; border-left: ${w}px solid ${color}; padding-left: ${w + 12}px; margin-top: ${s.sectionGap}px;`);
        } else if (decor === 'underline') {
            const color = layout.h1.decorColor || colors.accent;
            const cur = h1.getAttribute('style') || '';
            h1.setAttribute('style', `${cur}; border-bottom: 3px solid ${color}; padding-bottom: 10px; margin-top: ${s.sectionGap}px;`);
        }
    });

    // ═══════════════════════════════════════════════
    // H2 — 3 decoration styles
    // ═══════════════════════════════════════════════

    doc.querySelectorAll('h2').forEach(h2 => {
        const decor = layout.h2.decor || 'none';
        const color = layout.h2.decorColor || colors.accent;
        const w = layout.h2.decorWidth || 5;
        const cur = h2.getAttribute('style') || '';
        if (decor === 'left-bar') {
            h2.setAttribute('style', `${cur}; border-left: ${w}px solid ${color}; padding-left: ${w + 12}px; margin-top: ${s.sectionGap}px;`);
        } else if (decor === 'colored-text') {
            h2.setAttribute('style', `${cur}; color: ${color} !important; margin-top: ${s.sectionGap}px;`);
        } else if (decor === 'underline') {
            h2.setAttribute('style', `${cur}; border-bottom: 2px solid ${color}; padding-bottom: 8px; margin-top: ${s.sectionGap}px; display: inline-block;`);
        }
    });

    // ═══════════════════════════════════════════════
    // H3
    // ═══════════════════════════════════════════════

    doc.querySelectorAll('h3').forEach(h3 => {
        const decor = layout.h3.decor || 'none';
        const color = layout.h3.decorColor || colors.accentSecondary || colors.accent;
        const w = layout.h3.decorWidth || 3;
        const cur = h3.getAttribute('style') || '';
        if (decor === 'left-bar') {
            h3.setAttribute('style', `${cur}; border-left: ${w}px solid ${color}; padding-left: ${w + 10}px;`);
        } else if (decor === 'colored-text') {
            h3.setAttribute('style', `${cur}; color: ${color} !important;`);
        }
    });

    // ═══════════════════════════════════════════════
    // Blockquote → Callout transformation
    // ═══════════════════════════════════════════════

    const callout = layout.callout;
    if (callout.variant !== 'none') {
        doc.querySelectorAll('blockquote').forEach(bq => {
            const cur = bq.getAttribute('style') || '';
            const mt = callout.marginTop ?? s.sectionGap;
            const mb = callout.marginBottom ?? s.sectionGap;
            const p = callout.padding ?? 24;
            let extra = '';

            if (callout.variant === 'bg-card') {
                // Large colored background card
                extra = [
                    `background-color: ${callout.bgColor || colors.accent + '15'}`,
                    `padding: ${p + 4}px ${p}px`,
                    `margin: ${mt + 8}px 0 ${mb + 8}px 0`,
                ].join('; ');
                // Make inner <p> margins relaxed
                bq.querySelectorAll('p').forEach(inner => {
                    inner.setAttribute('style', (inner.getAttribute('style') || '') + `; margin: ${s.paragraphGap}px 0;`);
                });
            } else if (callout.variant === 'left-border') {
                // Bold left border, no bg
                extra = [
                    `border-left: ${callout.borderWidth || 5}px solid ${callout.borderColor || colors.accent}`,
                    `padding: ${p}px ${p}px ${p}px ${(callout.borderWidth || 5) + p}px`,
                    `margin: ${mt}px 0 ${mb}px 0`,
                    `background-color: transparent`,
                ].join('; ');
            } else if (callout.variant === 'subtle-card') {
                // Very subtle bg card
                extra = [
                    `background-color: ${callout.bgColor || colors.accent + '08'}`,
                    `padding: ${p}px`,
                    `margin: ${mt}px 0 ${mb}px 0`,
                    `border: none`,
                ].join('; ');
            }
            bq.setAttribute('style', cur + '; ' + extra);
        });
    }

    // ═══════════════════════════════════════════════
    // Images
    // ═══════════════════════════════════════════════

    const imgL = layout.image;
    doc.querySelectorAll('img').forEach(img => {
        if (img.closest('.image-grid')) return;
        const cur = img.getAttribute('style') || '';
        const radius = (imgL.borderRadius ?? 0) + 'px';
        let shadow = '';
        if (imgL.shadow === 'subtle') shadow = 'box-shadow: 0 4px 16px rgba(0,0,0,0.08);';
        else if (imgL.shadow === 'medium') shadow = 'box-shadow: 0 8px 28px rgba(0,0,0,0.14);';
        img.setAttribute('style', `${cur}; border-radius: ${radius}; ${shadow}`.trim());
    });

    // Image captions from alt text
    if (imgL.caption?.enabled) {
        doc.querySelectorAll('p').forEach(p => {
            const imgs = p.querySelectorAll('img');
            if (imgs.length !== 1) return;
            const alt = imgs[0].getAttribute('alt') || '';
            if (!alt) return;
            const cap = doc.createElement('div');
            cap.setAttribute('style', [
                `text-align: ${imgL.caption?.position === 'below-left' ? 'left' : 'center'}`,
                `font-size: ${imgL.caption?.fontSize || 14}px`,
                `color: ${imgL.caption?.color || '#999'}`,
                `margin-top: 6px`,
                `margin-bottom: ${s.sectionGap}px`,
                `line-height: 1.5`,
            ].join('; '));
            cap.textContent = alt;
            p.parentNode?.insertBefore(cap, p.nextSibling);
        });
    }

    // ═══════════════════════════════════════════════
    // Spacing system
    // ═══════════════════════════════════════════════

    doc.querySelectorAll('p').forEach(p => {
        if (p.closest('.image-grid')) return;
        const cur = p.getAttribute('style') || '';
        p.setAttribute('style', `${cur}; margin-top: ${s.paragraphGap}px; margin-bottom: ${s.paragraphGap}px; line-height: ${s.lineHeight};`);
    });

    doc.querySelectorAll('h2, h3').forEach(h => {
        const cur = h.getAttribute('style') || '';
        if (!cur.includes('margin-top') || cur.includes('margin-top: 40px')) {
            h.setAttribute('style', `${cur}; margin-top: ${s.sectionGap}px;`);
        }
    });

    // ═══════════════════════════════════════════════
    // Divider
    // ═══════════════════════════════════════════════

    if (layout.divider) {
        doc.querySelectorAll('hr').forEach(hr => {
            const d = layout.divider!;
            hr.setAttribute('style', [
                `margin: ${d.marginTop || 48}px 0 ${d.marginBottom || 48}px 0`,
                `border: none`,
                `height: ${d.height || 1}px`,
                `background-color: ${d.color || '#e5e5e5'}`,
                `width: 100%`,
            ].join('; '));
        });
    }

    // ═══════════════════════════════════════════════
    // Bold / Strong emphasis
    // ═══════════════════════════════════════════════

    if (layout.strong) {
        const st = layout.strong;
        doc.querySelectorAll('strong').forEach(el => {
            const cur = el.getAttribute('style') || '';
            const parts: string[] = [];
            if (st.color) parts.push(`color: ${st.color} !important`);
            if (st.bgColor && st.bgColor !== 'transparent') {
                parts.push(`background-color: ${st.bgColor}`);
                parts.push(`padding: ${st.padding || '2px 6px'}`);
                parts.push(`border-radius: ${st.borderRadius || '0'}`);
            }
            if (parts.length > 0) {
                el.setAttribute('style', cur + '; ' + parts.join('; '));
            }
        });
    }

    // ═══════════════════════════════════════════════
    // Content padding — wrap all body children
    // ═══════════════════════════════════════════════

    const body = doc.body;
    const wrapper = doc.createElement('div');
    wrapper.setAttribute('style', `padding: 8px ${pad.right}px 48px ${pad.left}px; background-color: ${colors.pageBg};`);
    while (body.firstChild) {
        wrapper.appendChild(body.firstChild);
    }
    body.appendChild(wrapper);
}

/**
 * Apply color tokens from the theme's color palette.
 */
function applyColors(doc: Document, colors: ThemeColors) {
    doc.querySelectorAll('p, li').forEach(el => {
        const cur = el.getAttribute('style') || '';
        if (!cur.includes('color:')) {
            el.setAttribute('style', `${cur}; color: ${colors.textPrimary};`);
        }
    });
    doc.querySelectorAll('a').forEach(el => {
        const cur = el.getAttribute('style') || '';
        if (!cur.includes('color:')) {
            el.setAttribute('style', `${cur}; color: ${colors.linkColor}; border-bottom: 1px solid ${colors.linkColor}; text-decoration: none;`);
        }
    });
    doc.querySelectorAll('code').forEach(el => {
        if (el.parentElement?.tagName === 'PRE') return;
        const cur = el.getAttribute('style') || '';
        el.setAttribute('style', `${cur}; background-color: ${colors.codeBg || '#f5f5f5'}; color: ${colors.codeColor || colors.accent};`);
    });
    doc.querySelectorAll('pre').forEach(el => {
        const cur = el.getAttribute('style') || '';
        el.setAttribute('style', `${cur}; background-color: ${colors.codeBg || '#f5f5f5'};`);
    });
    doc.querySelectorAll('th').forEach(el => {
        const cur = el.getAttribute('style') || '';
        el.setAttribute('style', `${cur}; background-color: ${colors.tableHeaderBg || '#f5f5f5'};`);
    });
    doc.querySelectorAll('td, th').forEach(el => {
        let cur = el.getAttribute('style') || '';
        if (el.tagName === 'TD' && !cur.includes('color:')) {
            cur += `; color: ${colors.textPrimary}`;
        }
        el.setAttribute('style', `${cur}; border-color: ${colors.tableBorder || '#e5e5e5'};`);
    });
    // Ensure body inherits correct bg
    doc.body.setAttribute('style', `background-color: ${colors.pageBg}; margin: 0; padding: 0;`);
}

export function applyTheme(html: string, themeId: string) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const style = theme.styles;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // ── New architecture colors run early (so legacy can refine details) ──
    const isNewArch = !!(theme.layout && theme.colors);
    if (isNewArch && theme.colors) {
        applyColors(doc, theme.colors);
    }

    // Note: Indexing is handled separately by markElementIndexes() function
    // to keep the core rendering logic decoupled from the click-to-locate feature

    // Specific inline overrides to prevent headings from uninheriting styles
    const headingInlineOverrides: Record<string, string> = {
        strong: 'font-weight: 700; color: inherit !important; background-color: transparent !important;',
        em: 'font-style: italic; color: inherit !important; background-color: transparent !important;',
        a: 'color: inherit !important; text-decoration: none !important; border-bottom: 1px solid currentColor !important; background-color: transparent !important;',
        code: 'color: inherit !important; background-color: transparent !important; border: none !important; padding: 0 !important;',
    };


    const getSingleImageNode = (p: HTMLParagraphElement): HTMLElement | null => {
        const children = Array.from(p.childNodes).filter(n =>
            !(n.nodeType === Node.TEXT_NODE && !(n.textContent || '').trim()) &&
            !(n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === 'BR')
        );
        if (children.length !== 1) return null;
        const onlyChild = children[0];
        if (onlyChild.nodeName === 'IMG') return onlyChild as HTMLElement;
        if (onlyChild.nodeName === 'A' && onlyChild.childNodes.length === 1 && onlyChild.childNodes[0].nodeName === 'IMG') {
            return onlyChild as HTMLElement;
        }
        return null;
    };

    // Check if a paragraph contains only images (for base64 images or multiple images in one paragraph)
    const isImageOnlyParagraph = (p: HTMLParagraphElement): boolean => {
        const children = Array.from(p.childNodes).filter(n =>
            !(n.nodeType === Node.TEXT_NODE && !(n.textContent || '').trim()) &&
            !(n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === 'BR')
        );
        if (children.length === 0) return false;
        return children.every(n =>
            n.nodeName === 'IMG' ||
            (n.nodeName === 'A' && n.childNodes.length === 1 && n.childNodes[0].nodeName === 'IMG')
        );
    };

    // Merge consecutive image-only paragraphs (same parent) into pair-wise side-by-side grids.
    const paragraphSnapshot = Array.from(doc.querySelectorAll('p'));
    const processed = new Set<HTMLParagraphElement>();

    for (const paragraph of paragraphSnapshot) {
        if (!paragraph.isConnected || processed.has(paragraph)) continue;
        if (!getSingleImageNode(paragraph) && !isImageOnlyParagraph(paragraph)) continue;

        const run: HTMLParagraphElement[] = [paragraph];
        processed.add(paragraph);

        let cursor = paragraph.nextElementSibling;
        while (cursor && cursor.tagName === 'P') {
            const p = cursor as HTMLParagraphElement;
            if (!getSingleImageNode(p) && !isImageOnlyParagraph(p)) break;
            run.push(p);
            processed.add(p);
            cursor = p.nextElementSibling;
        }

        if (run.length < 2) continue;

        // Collect all images from the run
        const allImages: HTMLElement[] = [];
        run.forEach(p => {
            if (getSingleImageNode(p)) {
                const img = getSingleImageNode(p);
                if (img) allImages.push(img);
            } else if (isImageOnlyParagraph(p)) {
                const images = p.querySelectorAll('img');
                images.forEach(img => allImages.push(img as HTMLElement));
            }
        });

        // Create grid paragraphs with 2 images each
        const firstParagraph = run[0];
        let lastInserted: HTMLElement | null = null;

        for (let i = 0; i < allImages.length; i += 2) {
            const gridParagraph = doc.createElement('p');
            gridParagraph.classList.add('image-grid');
            gridParagraph.setAttribute('style', 'display: flex; justify-content: center; gap: 8px; margin: 24px 0; align-items: flex-start;');

            gridParagraph.appendChild(allImages[i]);
            if (i + 1 < allImages.length) {
                gridParagraph.appendChild(allImages[i + 1]);
            }

            if (i === 0) {
                firstParagraph.before(gridParagraph);
                lastInserted = gridParagraph;
            } else if (lastInserted) {
                lastInserted.after(gridParagraph);
                lastInserted = gridParagraph;
            }
        }

        // Remove original paragraphs
        run.forEach(p => {
            if (p.isConnected) p.remove();
        });
    }

    // Process image grids
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach(p => {
        const children = Array.from(p.childNodes).filter(n => !(n.nodeType === Node.TEXT_NODE && !(n.textContent || '').trim()));
        const isAllImages = children.length > 1 && children.every(n => n.nodeName === 'IMG' || (n.nodeName === 'A' && n.childNodes.length === 1 && n.childNodes[0].nodeName === 'IMG'));

        if (isAllImages) {
            p.classList.add('image-grid');
            p.setAttribute('style', 'display: flex; justify-content: center; gap: 8px; margin: 24px 0; align-items: flex-start;');

            p.querySelectorAll('img').forEach(img => {
                img.classList.add('grid-img');
                const w = 100 / children.length;
                img.setAttribute('style', `width: calc(${w}% - ${8 * (children.length - 1) / children.length}px); margin: 0; border-radius: 8px; height: auto;`);
            });
        }
    });

    Object.keys(style).forEach((selector) => {

        if (selector === 'pre code') return;
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => {
            if (selector === 'code' && el.parentElement?.tagName === 'PRE') return;
            if (el.tagName === 'IMG' && el.closest('.image-grid')) return;
            const currentStyle = el.getAttribute('style') || '';
            el.setAttribute('style', currentStyle + '; ' + style[selector as keyof typeof style]);
        });
    });

    // Tailwind preflight removes native list markers. Restore explicit markers.
    doc.querySelectorAll('ul').forEach(ul => {
        const currentStyle = ul.getAttribute('style') || '';
        ul.setAttribute('style', `${currentStyle}; list-style-type: disc !important; list-style-position: outside;`);
    });
    doc.querySelectorAll('ul ul').forEach(ul => {
        const currentStyle = ul.getAttribute('style') || '';
        ul.setAttribute('style', `${currentStyle}; list-style-type: circle !important;`);
    });
    doc.querySelectorAll('ul ul ul').forEach(ul => {
        const currentStyle = ul.getAttribute('style') || '';
        ul.setAttribute('style', `${currentStyle}; list-style-type: square !important;`);
    });
    doc.querySelectorAll('ol').forEach(ol => {
        const currentStyle = ol.getAttribute('style') || '';
        ol.setAttribute('style', `${currentStyle}; list-style-type: decimal !important; list-style-position: outside;`);
    });

    const hljsLight: Record<string, string> = {
        'hljs-comment': 'color: #6a737d; font-style: normal;',
        'hljs-quote': 'color: #6a737d; font-style: normal;',
        'hljs-keyword': 'color: #d73a49; font-weight: 600;',
        'hljs-selector-tag': 'color: #d73a49; font-weight: 600;',
        'hljs-string': 'color: #032f62;',
        'hljs-title': 'color: #6f42c1; font-weight: 600;',
        'hljs-section': 'color: #6f42c1; font-weight: 600;',
        'hljs-type': 'color: #005cc5; font-weight: 600;',
        'hljs-number': 'color: #005cc5;',
        'hljs-literal': 'color: #005cc5;',
        'hljs-built_in': 'color: #005cc5;',
        'hljs-variable': 'color: #e36209;',
        'hljs-template-variable': 'color: #e36209;',
        'hljs-tag': 'color: #22863a;',
        'hljs-name': 'color: #22863a;',
        'hljs-attr': 'color: #6f42c1;',
    };

    const codeTokens = doc.querySelectorAll('.hljs span');
    codeTokens.forEach(span => {
        let inlineStyle = span.getAttribute('style') || '';
        if (inlineStyle && !inlineStyle.endsWith(';')) inlineStyle += '; ';
        span.classList.forEach(cls => {
            if (hljsLight[cls]) {
                inlineStyle += hljsLight[cls] + '; ';
            }
        });
        if (inlineStyle) {
            span.setAttribute('style', inlineStyle);
        }
    });

    doc.querySelectorAll('pre').forEach(pre => {
        const currentStyle = pre.getAttribute('style') || '';
        pre.setAttribute(
            'style',
            `${currentStyle}; font-variant-ligatures: none; tab-size: 2;`
        );
    });

    doc.querySelectorAll('pre code, pre .hljs, .hljs').forEach(codeNode => {
        const currentStyle = codeNode.getAttribute('style') || '';
        codeNode.setAttribute(
            'style',
            `${currentStyle}; display: block; font-size: inherit !important; line-height: inherit !important; font-style: normal !important; white-space: pre; word-break: normal; overflow-wrap: normal;`
        );
    });

    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        Object.keys(headingInlineOverrides).forEach(tag => {
            heading.querySelectorAll(tag).forEach(node => {
                const override = headingInlineOverrides[tag];
                node.setAttribute('style', `${node.getAttribute('style') || ''}; ${override}`);
            });
        });
    });

    // Unify image look-and-feel across themes.
    // Skip for new-architecture themes (layout handles image styling).
    if (!theme.layout) {
        doc.querySelectorAll('img').forEach(img => {
            const inGrid = Boolean(img.closest('.image-grid'));
            const currentStyle = img.getAttribute('style') || '';
            const appendedStyle = inGrid
                ? 'display:block; max-width:100%; height:auto; margin:0 !important; padding:8px !important; border-radius:14px !important; box-sizing:border-box; box-shadow:0 12px 28px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.12); border:1px solid rgba(255,255,255,0.75);'
                : 'display:block; width:100%; max-width:100%; height:auto; margin:30px auto !important; padding:8px !important; border-radius:14px !important; box-sizing:border-box; box-shadow:0 16px 34px rgba(15,23,42,0.22), 0 4px 10px rgba(15,23,42,0.12); border:1px solid rgba(15,23,42,0.12);';
            img.setAttribute('style', `${currentStyle}; ${appendedStyle}`);
        });
    }

    const container = doc.createElement('div');

    // ── New architecture: layout transforms run LAST to override legacy styles ──
    if (isNewArch) {
        applyLayoutTransform(doc, theme.layout!, theme.colors!);
    }

    container.setAttribute('style', style.container);
    container.innerHTML = doc.body.innerHTML;

    return container.outerHTML;
}
