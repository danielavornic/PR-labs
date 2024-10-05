import BaseSerializer from "./base-serializer";

class JSONSerializer extends BaseSerializer {
  private static readonly SPECIAL_CHARS: Readonly<Record<string, string>> = {
    '"': '\\"',
    "\\": "\\\\",
    "\b": "\\b",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t",
  };

  serialize(data: unknown): string {
    return this.serializeValue(data);
  }

  protected serializeNull(): string {
    return "null";
  }

  protected serializeUndefined(): string {
    return "undefined";
  }

  protected serializeString(value: string): string {
    return `"${this.escapeString(value)}"`;
  }

  protected serializeNumber(value: number): string {
    return isFinite(value) ? String(value) : "null";
  }

  protected serializeBoolean(value: boolean): string {
    return String(value);
  }

  protected serializeDate(value: Date): string {
    return `"${value.toISOString()}"`;
  }

  protected serializeArray(arr: unknown[]): string {
    const values = arr.map((item) => this.serializeValue(item));
    return `[${values.join(",")}]`;
  }

  protected serializeObject(obj: Record<string, unknown>): string {
    const pairs: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      pairs.push(`"${this.escapeString(key)}":${this.serializeValue(value)}`);
    }
    return `{${pairs.join(",")}}`;
  }

  protected serializeUnknown(): string {
    return "null";
  }

  protected escapeString(str: string): string {
    return str.replace(/[\\"\u0000-\u001f]/g, (char) => {
      // JSON requires exactly four hexadecimal digits for Unicode escapes
      return (
        JSONSerializer.SPECIAL_CHARS[char] ||
        `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
      );
    });
  }
}

export default JSONSerializer;
