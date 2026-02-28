import React from "react";

type Props = {
  children?: React.ReactNode;
  language?: string;
};

const SyntaxHighlighterMock = ({ children }: Props) => (
  <pre>
    <code>{children}</code>
  </pre>
);

export const Prism = SyntaxHighlighterMock;
export default SyntaxHighlighterMock;
