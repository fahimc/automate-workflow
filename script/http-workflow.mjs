import https from "https";

export class HttpWorkflow {
  constructor(options) {
    this.name = options?.name || "";
    this.headers = options?.headers || {};
    this.queryParams = options?.queryParams || {};
    this.url = options?.url || "";
  }
  run() {
    // Construct query parameters
    const queryString = new URLSearchParams(this.queryParams).toString();
    const endpointUrl = this.url + (queryString ? `?${queryString}` : "");

    return new Promise((resolve, reject) => {
      const options = {
        headers: this.headers,
      };

      https
        .get(endpointUrl, options, (response) => {
          let data = "";

          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", () => {
            resolve(data);
          });
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }
}
