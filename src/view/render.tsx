import { VNode } from "preact";
import { render } from "preact-render-to-string";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderToString(vnode: VNode<any>): string {
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
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body>
    ${body}
</body>
</html>`;
}
