import React from 'react';
import { Source } from './utils/source.macro';

export type Docs = {
  meta: Meta;
  description?: JSX.Element | JSX.Element[];
  examples?: DocsExample[];
};

export type DocsExample = Example & {
  examples?: DocsExample[];
  description?: JSX.Element | JSX.Element[];
  enablePlayroom?: boolean;
  enableCodeSnippet?: boolean;
  showFrame?: boolean;
};

export type Example = {
  name: string;
  subTitle?: string;
  Example?: () => Source<React.ReactChild>;
  examples?: Example[];
};

export type Meta = {
  name?: string;
  category: 'Color' | 'Content' | 'Layout' | 'Typography';
};

export type Playground = {
  meta: Meta;
  examples: Example[];
};
