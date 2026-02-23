import React from "react";

type Props = {
  children: string;
};

const ReactMarkdown = ({ children }: Props) => {
  return <div data-testid="markdown-body">{children}</div>;
};

export default ReactMarkdown;
