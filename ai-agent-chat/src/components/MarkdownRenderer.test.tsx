/// <reference types="jest" />
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
declare const describe: (name: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (value: unknown) => {
  toBe: (expected: unknown) => void;
  toBeNull: () => void;
  toBeTruthy: () => void;
  toContain: (expected: string) => void;
};
declare const jest: {
  mock: (moduleName: string, factory: () => unknown) => void;
};

jest.mock("remark-gfm", () => () => null);
jest.mock("remark-breaks", () => () => null);
jest.mock("react-markdown", () => {
  const React = require("react");

  function renderInline(
    text: string,
    components: Record<string, React.ComponentType<any>> | undefined,
    urlTransform?: (url: string) => string,
  ) {
    const nodes: React.ReactNode[] = [];
    const pattern = /(\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
    let lastIndex = 0;
    let key = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith("[")) {
        const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
        if (linkMatch) {
          const [, label, rawHref] = linkMatch;
          const href = urlTransform ? urlTransform(rawHref) : rawHref;
          const Link = components?.a || "a";
          nodes.push(React.createElement(Link, { href, key: key += 1 }, label));
        }
      } else {
        const code = token.slice(1, -1);
        const Code = components?.code || "code";
        nodes.push(
          React.createElement(
            Code,
            {
              key: key += 1,
              node: { position: { start: { line: 1 }, end: { line: 1 } } },
            },
            code,
          ),
        );
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes;
  }

  return function MockReactMarkdown({
    children,
    components = {},
    urlTransform,
  }: {
    children: string;
    components?: Record<string, React.ComponentType<any>>;
    urlTransform?: (url: string) => string;
  }) {
    const Code = components.code || "code";
    const Paragraph = components.p || "p";
    const Pre = components.pre || "pre";

    const fencedCodeMatch = /^```(?:([\w-]+))?\n([\s\S]*?)\n```$/.exec(children.trim());
    if (fencedCodeMatch) {
      const [, language, code] = fencedCodeMatch;
      return React.createElement(
        Pre,
        null,
        React.createElement(
          Code,
          {
            className: language ? `language-${language}` : undefined,
            node: { position: { start: { line: 1 }, end: { line: 3 } } },
          },
          code,
        ),
      );
    }

    return React.createElement(
      Paragraph,
      null,
      ...renderInline(children, components, urlTransform),
    );
  };
});

import { MarkdownRenderer } from "../features/chat/components/MarkdownRenderer";

describe("MarkdownRenderer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderMarkdown(props: React.ComponentProps<typeof MarkdownRenderer>) {
    act(() => {
      root.render(<MarkdownRenderer {...props} />);
    });
  }

  it("filters unsafe links while keeping the label text", () => {
    renderMarkdown({ content: "[恶意链接](javascript:alert(1))" });

    expect(container.textContent).toContain("恶意链接");
    expect(container.querySelector("a")).toBeNull();
  });

  it("renders safe links with hardened rel attributes", () => {
    renderMarkdown({ content: "[OpenAI](https://openai.com/docs)" });

    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("https://openai.com/docs");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("ugc nofollow noopener noreferrer");
  });

  it("renders inline code without upgrading it to a block", () => {
    renderMarkdown({ content: "Use `npm test` here." });

    expect(container.textContent).toContain("npm test");
    expect(container.querySelector("button[aria-label='copy-code']")).toBeNull();
    expect(container.querySelector("pre")).toBeNull();
  });

  it("renders fenced code blocks without a language as a code block", () => {
    renderMarkdown({
      content: "```\nconst answer = 42;\nconsole.log(answer);\n```",
    });

    expect(container.querySelector("button[aria-label='copy-code']")).toBeTruthy();
    expect(container.querySelector("pre")).toBeTruthy();
    expect(container.textContent).toContain("const answer = 42;");
  });

  it("renders streaming content together with the cursor indicator", () => {
    renderMarkdown({ content: "正在生成答案", isStreaming: true });

    expect(container.textContent).toContain("正在生成答案");
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });
});
