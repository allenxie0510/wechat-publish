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
 * This restructures the DOM (wrap, add decorators) before color application.
 */
function applyLayoutTransform(doc: Document, layout: ThemeLayout, colors: ThemeColors) {
    const spacing = layout.spacing;

    // ── H1: Color-block decoration ──
    if (layout.h1.decor === 'color-block') {
        doc.querySelectorAll('h1').forEach(h1 => {
            const card = doc.createElement('div');
            const h1Color = layout.h1.decorColor || colors.accent;
            const bg = layout.h1.decorBg || colors.accent + '10';
            const radius = (layout.h1.decorRadius ?? 0) + 'px';
            const align = layout.h1.align || 'left';
            card.setAttribute('style', [
                `background-color: ${bg}`,
                `padding: 32px 28px`,
                `margin: ${spacing.sectionGap}px 0 ${spacing.paragraphGap}px 0`,
                `border-radius: ${radius}`,
                `text-align: ${align}`,
                layout.h1.decorWidth && layout.h1.decorWidth > 0
                    ? `border-left: ${layout.h1.decorWidth}px solid ${h1Color}`
                    : '',
            ].filter(Boolean).join('; '));
            h1.parentNode?.insertBefore(card, h1);
            card.appendChild(h1);
            // Reset h1 margins since card handles spacing
            h1.setAttribute('style', (h1.getAttribute('style') || '') + '; margin: 0 !important; border: none !important;');
        });
    }

    // ── H1: Left-bar decoration ──
    if (layout.h1.decor === 'left-bar') {
        doc.querySelectorAll('h1').forEach(h1 => {
            const color = layout.h1.decorColor || colors.accent;
            const w = layout.h1.decorWidth || 4;
            const current = h1.getAttribute('style') || '';
            h1.setAttribute('style', `${current}; border-left: ${w}px solid ${color}; padding-left: ${w + 8}px; margin-left: 0;`);
        });
    }

    // ── H1: Underline decoration ──
    if (layout.h1.decor === 'underline') {
        doc.querySelectorAll('h1').forEach(h1 => {
            const color = layout.h1.decorColor || colors.accent;
            const current = h1.getAttribute('style') || '';
            h1.setAttribute('style', `${current}; border-bottom: 2px solid ${color}; padding-bottom: 8px;`);
        });
    }

    // ── H2: Left-bar / Colored-text ──
    doc.querySelectorAll('h2').forEach(h2 => {
        const decor = layout.h2.decor || 'none';
        const color = layout.h2.decorColor || colors.accent;
        const w = layout.h2.decorWidth || 4;
        const current = h2.getAttribute('style') || '';
        if (decor === 'left-bar') {
            h2.setAttribute('style', `${current}; border-left: ${w}px solid ${color}; padding-left: ${w + 8}px;`);
        } else if (decor === 'colored-text') {
            h2.setAttribute('style', `${current}; color: ${color} !important;`);
        } else if (decor === 'underline') {
            h2.setAttribute('style', `${current}; border-bottom: 2px solid ${color}; padding-bottom: 6px;`);
        }
    });

    // ── H3: Left-bar / Colored-text ──
    doc.querySelectorAll('h3').forEach(h3 => {
        const decor = layout.h3.decor || 'none';
        const color = layout.h3.decorColor || colors.accentSecondary || colors.accent;
        const w = layout.h3.decorWidth || 3;
        const current = h3.getAttribute('style') || '';
        if (decor === 'left-bar') {
            h3.setAttribute('style', `${current}; border-left: ${w}px solid ${color}; padding-left: ${w + 8}px;`);
        } else if (decor === 'colored-text') {
            h3.setAttribute('style', `${current}; color: ${color} !important;`);
        }
    });

    // ── Callout / Blockquote ──
    const callout = layout.callout;
    if (callout.variant !== 'none') {
        doc.querySelectorAll('blockquote').forEach(bq => {
            const current = bq.getAttribute('style') || '';
            let extra = '';
            if (callout.variant === 'bg-card') {
                extra = `background-color: ${callout.bgColor || colors.accent + '10'}; padding: ${callout.padding || 24}px; margin: ${callout.marginTop || 24}px 0 ${callout.marginBottom || 24}px 0; border-radius: ${callout.borderRadius ?? 0}px; border: none;`;
            } else if (callout.variant === 'left-border') {
                extra = `border-left: ${callout.borderWidth || 4}px solid ${callout.borderColor || colors.accent}; padding: ${callout.padding || 16}px ${callout.padding || 16}px ${callout.padding || 16}px ${(callout.padding || 16) + 4}px; margin: ${callout.marginTop || 24}px 0 ${callout.marginBottom || 24}px 0; background-color: transparent;`;
            } else if (callout.variant === 'subtle-card') {
                extra = `background-color: ${callout.bgColor || colors.accent + '08'}; padding: ${callout.padding || 20}px; border-radius: ${callout.borderRadius ?? 0}px; margin: ${callout.marginTop || 24}px 0 ${callout.marginBottom || 24}px 0; border: none;`;
            }
            bq.setAttribute('style', `${current}; ${extra}`);
        });
    }

    // ── Image styling ──
    const imgLayout = layout.image;
    doc.querySelectorAll('img').forEach(img => {
        const inGrid = Boolean(img.closest('.image-grid'));
        if (inGrid) return;
        const current = img.getAttribute('style') || '';
        const radius = (imgLayout.borderRadius ?? 0) + 'px';
        const shadowStyle = imgLayout.shadow === 'subtle'
            ? 'box-shadow: 0 4px 12px rgba(0,0,0,0.08);'
            : imgLayout.shadow === 'medium'
                ? 'box-shadow: 0 8px 24px rgba(0,0,0,0.12);'
                : '';
        img.setAttribute('style', `${current}; border-radius: ${radius}; ${shadowStyle}`.trim());
    });

    // ── Image captions (find img in p, add figcaption) ──
    if (imgLayout.caption?.enabled) {
        doc.querySelectorAll('p').forEach(p => {
            const imgs = p.querySelectorAll('img');
            if (imgs.length !== 1) return;
            const img = imgs[0];
            const alt = img.getAttribute('alt') || '';
            if (!alt) return;
            const captionColor = imgLayout.caption?.color || '#888888';
            const captionSize = imgLayout.caption?.fontSize || 14;
            const captionAlign = imgLayout.caption?.position === 'below-left' ? 'left' : 'center';
            const caption = doc.createElement('div');
            caption.setAttribute('style', `text-align: ${captionAlign}; font-size: ${captionSize}px; color: ${captionColor}; margin-top: 8px; margin-bottom: ${spacing.sectionGap}px; line-height: 1.5;`);
            caption.textContent = alt;
            p.parentNode?.insertBefore(caption, p.nextSibling);
        });
    }

    // ── Full-bleed images: remove padding/margin constraints ──
    if (imgLayout.fullBleed) {
        doc.querySelectorAll('img').forEach(img => {
            if (img.closest('.image-grid')) return;
            const current = img.getAttribute('style') || '';
            img.setAttribute('style', `${current}; width: 100%; max-width: 100%; margin-left: -${spacing.contentPadding?.left || 0}px; padding: 0;`.replace(/margin-left: -0px/g, 'margin-left: 0'));
        });
    }

    // ── Spacing: paragraph gaps ──
    doc.querySelectorAll('p').forEach(p => {
        if (p.closest('.image-grid')) return;
        const current = p.getAttribute('style') || '';
        p.setAttribute('style', `${current}; margin-top: ${spacing.paragraphGap}px; margin-bottom: ${spacing.paragraphGap}px; line-height: ${spacing.lineHeight};`);
    });

    // ── Section gap: add margin above h1/h2 ──
    doc.querySelectorAll('h2, h3').forEach(h => {
        const current = h.getAttribute('style') || '';
        if (!current.includes('margin-top')) {
            h.setAttribute('style', `${current}; margin-top: ${spacing.sectionGap}px;`);
        }
    });

    // ── Divider (hr) ──
    if (layout.divider) {
        doc.querySelectorAll('hr').forEach(hr => {
            const d = layout.divider!;
            hr.setAttribute('style', [
                `margin: ${d.marginTop || 40}px auto ${d.marginBottom || 40}px auto`,
                `border: none`,
                `height: ${d.height || 1}px`,
                `background-color: ${d.color || '#e5e5e5'}`,
                `width: 100%`,
                d.style === 'dashed' ? 'border-top: 1px dashed ' + (d.color || '#e5e5e5') : '',
            ].filter(Boolean).join('; '));
        });
    }

    // ── Strong emphasis ──
    if (layout.strong) {
        const s = layout.strong;
        doc.querySelectorAll('strong').forEach(el => {
            const current = el.getAttribute('style') || '';
            const parts: string[] = [];
            if (s.color) parts.push(`color: ${s.color} !important`);
            if (s.bgColor && s.bgColor !== 'transparent') parts.push(`background-color: ${s.bgColor}`);
            if (s.padding) parts.push(`padding: ${s.padding}`);
            if (s.borderRadius) parts.push(`border-radius: ${s.borderRadius}`);
            if (parts.length > 0) {
                el.setAttribute('style', `${current}; ${parts.join('; ')}`);
            }
        });
    }

    // ── Content padding wrapper ──
    if (spacing.contentPadding) {
        const body = doc.body;
        const wrapper = doc.createElement('div');
        wrapper.setAttribute('style', `padding: 0 ${spacing.contentPadding.right || 25}px 48px ${spacing.contentPadding.left || 25}px;`);
        while (body.firstChild) {
            wrapper.appendChild(body.firstChild);
        }
        body.appendChild(wrapper);
    }
}

/**
 * Apply color tokens directly to the DOM.
 * Used alongside layout transformations for new-architecture themes.
 */
function applyColors(doc: Document, colors: ThemeColors) {
    // Body text color
    doc.querySelectorAll('p, li').forEach(el => {
        const current = el.getAttribute('style') || '';
        if (!current.includes('color:')) {
            el.setAttribute('style', `${current}; color: ${colors.textPrimary};`);
        }
    });

    // Links
    doc.querySelectorAll('a').forEach(el => {
        const current = el.getAttribute('style') || '';
        if (!current.includes('color:')) {
            el.setAttribute('style', `${current}; color: ${colors.linkColor}; border-bottom: 1px solid ${colors.linkColor};`);
        }
    });

    // Code
    doc.querySelectorAll('code').forEach(el => {
        if (el.parentElement?.tagName === 'PRE') return;
        const current = el.getAttribute('style') || '';
        el.setAttribute('style', `${current}; background-color: ${colors.codeBg || '#f5f5f5'}; color: ${colors.codeColor || colors.accent};`);
    });

    // Pre
    doc.querySelectorAll('pre').forEach(el => {
        const current = el.getAttribute('style') || '';
        el.setAttribute('style', `${current}; background-color: ${colors.codeBg || '#f5f5f5'};`);
    });

    // Table
    doc.querySelectorAll('th').forEach(el => {
        const current = el.getAttribute('style') || '';
        el.setAttribute('style', `${current}; background-color: ${colors.tableHeaderBg || '#f5f5f5'};`);
    });
    doc.querySelectorAll('td, th').forEach(el => {
        const current = el.getAttribute('style') || '';
        if (el.tagName === 'TD' && !current.includes('color:')) {
            el.setAttribute('style', `${current}; color: ${colors.textPrimary};`);
        }
        el.setAttribute('style', `${el.getAttribute('style') || ''}; border-color: ${colors.tableBorder || '#e5e5e5'};`);
    });
}

export function applyTheme(html: string, themeId: string) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const style = theme.styles;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // ── New architecture: apply layout + colors before legacy styles ──
    if (theme.layout && theme.colors) {
        applyLayoutTransform(doc, theme.layout, theme.colors);
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
    container.setAttribute('style', style.container);
    container.innerHTML = doc.body.innerHTML;

    return container.outerHTML;
}
