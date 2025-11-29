import katex from 'katex';

/**
 * Processes HTML content and renders LaTeX expressions
 * Supports both inline ($...$) and block ($$...$$) LaTeX
 */
export const processLaTeXInHTML = (html) => {
  if (!html) return html;

  // Create a temporary container
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Function to process text nodes
  const processTextNode = (textNode) => {
    const text = textNode.textContent;
    
    // Match LaTeX expressions: $$...$$ for block, $...$ for inline
    // Exclude $ that are part of HTML entities or already processed
    const blockRegex = /\$\$([\s\S]*?)\$\$/g;
    const inlineRegex = /(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g;
    
    const matches = [];
    let match;
    
    // Find block LaTeX first ($$...$$)
    while ((match = blockRegex.exec(text)) !== null) {
      matches.push({
        type: 'block',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1].trim(),
        full: match[0]
      });
    }
    
    // Find inline LaTeX ($...$) but exclude those already in block matches
    const inlineText = text;
    let inlineIndex = 0;
    while ((match = inlineRegex.exec(inlineText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      // Check if this match overlaps with any block match
      const overlaps = matches.some(m => 
        (start >= m.start && start < m.end) || 
        (end > m.start && end <= m.end) ||
        (start <= m.start && end >= m.end)
      );
      
      if (!overlaps) {
        matches.push({
          type: 'inline',
          start: start,
          end: end,
          content: match[1].trim(),
          full: match[0]
        });
      }
    }
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // If no matches, return null
    if (matches.length === 0) return null;
    
    // Create fragments
    const fragments = [];
    let lastIndex = 0;
    
    matches.forEach(match => {
      // Add text before match
      if (match.start > lastIndex) {
        const beforeText = text.substring(lastIndex, match.start);
        if (beforeText) {
          fragments.push(document.createTextNode(beforeText));
        }
      }
      
      // Create LaTeX element
      try {
        const rendered = katex.renderToString(match.content, {
          throwOnError: false,
          displayMode: match.type === 'block',
          strict: false
        });
        
        const element = document.createElement(match.type === 'block' ? 'div' : 'span');
        element.className = match.type === 'block' ? 'latex-block' : 'latex-inline';
        element.innerHTML = rendered;
        fragments.push(element);
      } catch (error) {
        // If rendering fails, keep original text
        fragments.push(document.createTextNode(match.full));
      }
      
      lastIndex = match.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      fragments.push(document.createTextNode(text.substring(lastIndex)));
    }
    
    return fragments;
  };

  // Process all text nodes
  const walker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip script and style tags
        const parent = node.parentNode;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  // Process text nodes in reverse order to avoid index issues
  textNodes.reverse().forEach(textNode => {
    const fragments = processTextNode(textNode);
    if (fragments && fragments.length > 0) {
      const parent = textNode.parentNode;
      fragments.forEach(fragment => {
        parent.insertBefore(fragment, textNode);
      });
      parent.removeChild(textNode);
    }
  });

  return tempDiv.innerHTML;
};

