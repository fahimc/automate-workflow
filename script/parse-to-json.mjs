export class ParseToJsonWorkflow {
  constructor(options) {
    this.data = options?.data || "";
  }
  run() {
    return new Promise((resolve, reject) => {
      try {
        const jsonData = JSON.parse(this.data);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    });
  }
}
