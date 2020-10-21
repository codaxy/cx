export interface StructuredDataAccessor {
   getSelector(): (data: Cx.Record) => Cx.Record;
   get(): Cx.Record;
   setItem(key: string, value: any): boolean;
   containsKey(key): string;
   getKeys(): string[];
}
