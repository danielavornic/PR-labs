export class Product {
  constructor(
    public name: string,
    public price: number,
    public link: string,
    public color: string
  ) {}

  toJSON() {
    return {
      name: this.name,
      price: this.price,
      link: this.link,
      color: this.color,
    };
  }
}
