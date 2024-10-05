class Product {
  constructor(
    public name: string,
    public price: number,
    public color: string
  ) {}

  toJSON() {
    return {
      name: this.name,
      price: this.price,
      color: this.color,
    };
  }
}

export default Product;
