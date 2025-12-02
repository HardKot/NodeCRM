export function urlParamsParser(template, url) {
  const urlParts = url.split('?')[0].split('/').filter(Boolean);
  const templateParts = template.split('/').filter(Boolean);

  const urlParams = {};

  templateParts.forEach((part, index) => {
    if (part.startsWith('<') && part.endsWith('>')) {
      const content = part.slice(1, -1);
      const [name] = content.split(':');
      urlParams[name] = urlParts[index];
    }
  });

  return urlParts;
}
