declare module 'tiktoken' {
  export function encoding_for_model(model: string): {
    encode(text: string): number[];
    free(): void;
  };
}
