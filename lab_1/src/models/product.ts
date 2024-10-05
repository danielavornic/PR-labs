export class Product {
  constructor(
    public name: string,
    public price: number,
    public link: string,
    public color: string,
    public timestamp: Date = new Date()
  ) {}

  toJSON() {
    return {
      name: this.name,
      price: this.price,
      link: this.link,
      color: this.color,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
