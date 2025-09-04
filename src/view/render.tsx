import { VNode } from 'preact';
import { render } from 'preact-render-to-string';

export function renderToString(vnode: VNode): string {
  return render(vnode);
}

export function renderHtmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/assets/styles/main.build.css">
</head>
<body>
    ${body}
</body>
</html>`;
}
