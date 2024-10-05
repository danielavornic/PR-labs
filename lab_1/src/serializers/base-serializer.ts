abstract class BaseSerializer {
  abstract serialize(data: unknown): string;

  protected serializeValue(value: unknown): string {
    if (value === null) return this.serializeNull();
    if (value === undefined) return this.serializeUndefined();
    if (typeof value === "string") return this.serializeString(value);
    if (typeof value === "number") return this.serializeNumber(value);
    if (typeof value === "boolean") return this.serializeBoolean(value);
    if (value instanceof Date) return this.serializeDate(value);
    if (Array.isArray(value)) return this.serializeArray(value);
    if (typeof value === "object")
      return this.serializeObject(value as Record<string, unknown>);

    return this.serializeUnknown();
  }

  protected abstract serializeNull(): string;
  protected abstract serializeUndefined(): string;
  protected abstract serializeString(value: string): string;
  protected abstract serializeNumber(value: number): string;
  protected abstract serializeBoolean(value: boolean): string;
  protected abstract serializeDate(value: Date): string;
  protected abstract serializeArray(value: unknown[]): string;
  protected abstract serializeObject(value: Record<string, unknown>): string;
  protected abstract serializeUnknown(): string;

  protected abstract escapeString(str: string): string;
}

export default BaseSerializer;
