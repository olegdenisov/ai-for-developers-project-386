// Стаб для pretty-format — нужен для разрешения типов @testing-library/dom,
// которые импортируют OptionsReceived из этого модуля.
declare module 'pretty-format' {
  export interface OptionsReceived {
    callToJSON?: boolean;
    escapeRegex?: boolean;
    escapeString?: boolean;
    highlight?: boolean;
    indent?: number;
    maxDepth?: number;
    maxWidth?: number;
    min?: boolean;
    printBasicPrototype?: boolean;
    printFunctionName?: boolean;
    theme?: { [key: string]: string };
  }
}
