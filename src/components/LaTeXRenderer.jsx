import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './LaTeXRenderer.css';

const LaTeXRenderer = ({ content, className = '' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Parse content and render LaTeX
    const parseAndRender = (html) => {
      // Create a temporary container
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Find all text nodes and LaTeX expressions
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      // Process each text node for LaTeX
      textNodes.forEach(textNode => {
        const text = textNode.textContent;
        // Match LaTeX expressions: $...$ for inline, $$...$$ for block
        const latexRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]*?\$)/g;
        const matches = [...text.matchAll(latexRegex)];

        if (matches.length > 0) {
          const parent = textNode.parentNode;
          let lastIndex = 0;
          const fragments = [];

          matches.forEach(match => {
            // Add text before the match
            if (match.index > lastIndex) {
              const beforeText = text.substring(lastIndex, match.index);
              if (beforeText) {
                fragments.push(document.createTextNode(beforeText));
              }
            }

            // Process LaTeX expression
            const latexExpr = match[0];
            const isBlock = latexExpr.startsWith('$$');
            const latexContent = latexExpr.replace(/^\$\$?|\$\$?$/g, '').trim();

            try {
              const rendered = katex.renderToString(latexContent, {
                throwOnError: false,
                displayMode: isBlock,
                strict: false
              });

              const span = document.createElement(isBlock ? 'div' : 'span');
              span.className = isBlock ? 'latex-block' : 'latex-inline';
              span.innerHTML = rendered;
              fragments.push(span);
            } catch (error) {
              // If rendering fails, keep the original text
              fragments.push(document.createTextNode(latexExpr));
            }

            lastIndex = match.index + match[0].length;
          });

          // Add remaining text
          if (lastIndex < text.length) {
            fragments.push(document.createTextNode(text.substring(lastIndex)));
          }

          // Replace the text node with fragments
          if (fragments.length > 0) {
            fragments.forEach(fragment => {
              parent.insertBefore(fragment, textNode);
            });
            parent.removeChild(textNode);
          }
        }
      });

      return tempDiv.innerHTML;
    };

    // Render the processed content
    const processedContent = parseAndRender(content);
    containerRef.current.innerHTML = processedContent;
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`latex-container ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default LaTeXRenderer;

