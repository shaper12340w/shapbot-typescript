class A {
    private result: number;
  
    constructor() {
      this.result = 10;
    }
  
    async first(): Promise<A> {
      // 비동기 처리 작업
      this.result = await new Promise(resolve => {
        setTimeout(() => {
          resolve(20);
        }, 1000);
      });
      return this;
    }
  
    async second(): Promise<A> {
      console.log(this.result);
      return this;
    }
  }
  
  async function main() {
    const first = await new A().first()
    first.second();
  }
  
  main();
  