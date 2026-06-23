export interface ThemeLayout {
  h1: {
    align?: 'left' | 'center';
    decor?: 'none' | 'color-block' | 'left-bar' | 'underline';
    decorColor?: string;
    decorBg?: string;
    decorWidth?: number;
    decorRadius?: number;
  };
  h2: {
    align?: 'left' | 'center';
    decor?: 'none' | 'left-bar' | 'underline' | 'colored-text';
    decorColor?: string;
    decorWidth?: number;
  };
  h3: {
    align?: 'left' | 'center';
    decor?: 'none' | 'left-bar' | 'underline' | 'colored-text';
    decorColor?: string;
    decorWidth?: number;
  };
  image: {
    borderRadius?: number;
    shadow?: 'none' | 'subtle' | 'medium';
    caption?: {
      enabled: boolean;
      position?: 'below-center' | 'below-left';
      fontSize?: number;
      color?: string;
    };
    fullBleed?: boolean;
  };
  callout: {
    variant: 'none' | 'bg-card' | 'left-border' | 'subtle-card';
    bgColor?: string;
    borderColor?: string;
    borderWidth?: number;
    padding?: number;
    marginTop?: number;
    marginBottom?: number;
    borderRadius?: number;
  };
  list: {
    bulletColor?: string;
    numberColor?: string;
    indent?: number;
  };
  spacing: {
    paragraphGap: number;
    sectionGap: number;
    lineHeight: number;
    contentPadding?: { left: number; right: number };
  };
  divider?: {
    color?: string;
    height?: number;
    style?: string;
    marginTop?: number;
    marginBottom?: number;
  };
  strong?: {
    color?: string;
    bgColor?: string;
    padding?: string;
    borderRadius?: string;
  };
}

export interface ThemeColors {
  pageBg: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSecondary?: string;
  headingColor: string;
  linkColor: string;
  blockquoteBg?: string;
  blockquoteBorder?: string;
  blockquoteText?: string;
  codeBg?: string;
  codeColor?: string;
  tableBorder?: string;
  tableHeaderBg?: string;
  bodyFontSize?: number;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  styles: Record<string, string>;
  /** New architecture: layout rules for structural DOM transformation */
  layout?: ThemeLayout;
  /** New architecture: separated color tokens */
  colors?: ThemeColors;
}
