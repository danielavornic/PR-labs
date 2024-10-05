import BaseSerializer from "./base-serializer";

class XMLSerializer extends BaseSerializer {
  private static readonly SPECIAL_CHARS: Readonly<Record<string, string>> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  };

  private rootTag: string;

  constructor(rootTag: string = "root") {
    super();
    this.rootTag = rootTag;
  }

  serialize(data: unknown): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${
      this.rootTag
    }>${this.serializeValue(data)}</${this.rootTag}>`;
  }

  protected serializeNull(): string {
    return "";
  }

  protected serializeUndefined(): string {
    return "";
  }

  protected serializeString(value: string): string {
    return this.escapeString(value);
  }

  protected serializeNumber(value: number): string {
    return String(value);
  }

  protected serializeBoolean(value: boolean): string {
    return String(value);
  }

  protected serializeDate(value: Date): string {
    return value.toISOString();
  }

  protected serializeArray(arr: unknown[]): string {
    return arr
      .map((item) => `<item>${this.serializeValue(item)}</item>`)
      .join("");
  }

  protected serializeObject(obj: Record<string, unknown>): string {
    let xml = "";
    for (const [key, value] of Object.entries(obj)) {
      xml += `<${key}>${this.serializeValue(value)}</${key}>`;
    }
    return xml;
  }

  protected serializeUnknown(): string {
    return "";
  }

  protected escapeString(str: string): string {
    return str.replace(
      /[&<>"']/g,
      (char) => XMLSerializer.SPECIAL_CHARS[char] || char
    );
  }
}

export default XMLSerializer;
