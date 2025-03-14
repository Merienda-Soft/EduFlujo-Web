class HttpRequestFactory {
    constructor(private baseUrl: string = process.env.NEXT_PUBLIC_API_URL) {}

    createRequest(endpoint: string, method: string = 'GET', data: any = null, customHeaders: Record<string, string> = {}): { url: string; config: RequestInit } {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...customHeaders, 
      };
  
      const config: RequestInit = {
        method,
        headers,
      };
  
      if (data) {
        config.body = JSON.stringify(data);
      }
  
      return { url, config };
    }
  }
  
  export const httpRequestFactory = new HttpRequestFactory();