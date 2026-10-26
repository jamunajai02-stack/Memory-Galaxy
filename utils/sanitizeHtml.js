const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'a', 'span', 'div', 'font', 'blockquote', 'sub', 'sup'
]);

function sanitizeHtml(input) {
  if (!input) return '';
  let html = String(input);
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '');
  html = html.replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '');
  html = html.replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, '');
  html = html.replace(/<link[\s\S]*?>/gi, '');
  html = html.replace(/<meta[\s\S]*?>/gi, '');
  html = html.replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/javascript:/gi, '');
  html = html.replace(/data:/gi, '');

  html = html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
    const name = tag.toLowerCase();
    if (match.startsWith('</')) {
      return ALLOWED_TAGS.has(name) ? `</${name}>` : '';
    }
    if (!ALLOWED_TAGS.has(name)) return '';
    if (name === 'br') return '<br>';

    const safeAttrs = [];
    if (name === 'a') {
      const href = (attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)')/i) || [])[2]
        || (attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)')/i) || [])[3]
        || '';
      const url = String(href).trim();
      if (/^https?:\/\//i.test(url)) {
        safeAttrs.push(`href="${url.replace(/"/g, '')}"`, 'target="_blank"', 'rel="noopener noreferrer"');
      }
    }

    const style = (attrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i) || [])[2]
      || (attrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i) || [])[3]
      || '';
    if (style) {
      const filtered = style
        .split(';')
        .map((part) => part.trim())
        .filter((part) => /^(color|background-color|font-size|font-family|text-align|font-weight|font-style|text-decoration)\s*:/i.test(part))
        .join('; ');
      if (filtered) safeAttrs.push(`style="${filtered}"`);
    }

    const color = (attrs.match(/color\s*=\s*("([^"]*)"|'([^']*)')/i) || [])[2];
    if (color && /^#?[0-9a-f]{3,8}$/i.test(color)) {
      safeAttrs.push(`color="${color}"`);
    }

    const face = (attrs.match(/face\s*=\s*("([^"]*)"|'([^']*)')/i) || [])[2];
    if (face) safeAttrs.push(`face="${face.replace(/[^a-z0-9 ,-]/gi, '')}"`);

    const size = (attrs.match(/size\s*=\s*("([^"]*)"|'([^']*)'|[0-9]+)/i) || [])[2];
    if (size && /^[1-7]$/.test(size)) safeAttrs.push(`size="${size}"`);

    return `<${name}${safeAttrs.length ? ` ${safeAttrs.join(' ')}` : ''}>`;
  });

  return html;
}

module.exports = sanitizeHtml;
