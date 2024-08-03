import { GOOGLE_SHEET_API_BASEURL } from "../constants";
import { createPath } from "../utils/path";
import RequestQueue from "./request_queue";
import TokenManager from "./token_manager";

const enum HTTP_METHOD {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
}

interface RESTOptions {
  baseURL: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface HTTPResponse {
  ok: boolean;
  headers: Headers;
  data: Record<string, any> | null;
  status: number;
  statusText: string;
  type: ResponseType;
  url: string;
  redirected: boolean;
}

export class REST {
  private _baseURL: string;
  private tokenManager: TokenManager;
  private queue: RequestQueue;

  constructor(options: RESTOptions) {
    this._baseURL = options.baseURL || "";
    this.queue = new RequestQueue();
    this.tokenManager = new TokenManager(this);
  }

  private _isAuthRequired() {
    return this.tokenManager.accessToken != null;
  }

  public async initAuth() {
    await this.tokenManager.init();
  }

  public static async _executeRequest(request: Request): Promise<HTTPResponse> {
    const response = await fetch(request);

    // TODO: handle errors
    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `HTTP Error: ${response.status} ${response.statusText} - ${error}`
      );
    }

    let responseData = null;

    const contentType = response.headers.get("Content-Type");
    if (contentType != null && contentType.includes("application/json")) {
      responseData = await response.json();
    }

    return {
      headers: response.headers,
      data: responseData,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      type: response.type,
      url: response.url,
      redirected: response.redirected,
    };
  }

  /** Create the "Request" type Object to put in the fetch function */
  private _createFetchRequestObject(
    endpoint: string,
    method: HTTP_METHOD,
    data: Record<string, any> | null,
    withCredentials: boolean = false
  ): Request {
    const options: RequestInit = {};

    const url = new URL(
      endpoint.startsWith("http")
        ? endpoint
        : createPath(this._baseURL, endpoint)
    );

    options.method = method;
    options.headers = {};

    if (this._isAuthRequired()) {
      options.headers[
        "Authorization"
      ] = `Bearer ${this.tokenManager.accessToken}`;
    }

    if (withCredentials) {
      options.credentials = "include";
    }

    if (data != null) {
      options.body = JSON.stringify(data);
      options.headers["Content-Type"] = "application/json";
    }

    return new Request(url, options);
  }

  private async _queueRequest(request: Request): Promise<HTTPResponse> {
    return await this.queue.enqueue(request);
  }

  /**
   * Q means Queue
   * @param endpoint Not included "/" at the beginning
   */
  public async makeQRequest(
    endpoint: string,
    method: HTTP_METHOD,
    data: Record<string, any> | null = null,
    withCredentials: boolean = false
  ) {
    const request = this._createFetchRequestObject(
      endpoint,
      method,
      data,
      withCredentials
    );
    const response = await this._queueRequest(request);

    return response;
  }

  /**
   *
   * @param endpoint Not included "/" at the beginning
   */
  public async makeRequest(
    endpoint: string,
    method: HTTP_METHOD,
    data: Record<string, any> | null = null,
    withCredentials: boolean = false
  ) {
    const request = this._createFetchRequestObject(
      endpoint,
      method,
      data,
      withCredentials
    );
    const response = await REST._executeRequest(request);

    return response;
  }

  public async get(endpoint: string, withCredentials: boolean = false) {
    return this.makeRequest(endpoint, HTTP_METHOD.GET, null, withCredentials);
  }

  public async post(
    endpoint: string,
    data: Record<string, any> | null = null,
    withCredentials: boolean = false
  ) {
    return this.makeRequest(endpoint, HTTP_METHOD.POST, data, withCredentials);
  }

  public async put(
    endpoint: string,
    data: Record<string, any> | null = null,
    withCredentials: boolean = false
  ) {
    return this.makeRequest(endpoint, HTTP_METHOD.PUT, data, withCredentials);
  }

  public async delete(endpoint: string, withCredentials: boolean = false) {
    return this.makeRequest(
      endpoint,
      HTTP_METHOD.DELETE,
      null,
      withCredentials
    );
  }

  public async qget(endpoint: string, withCredentials: boolean = false) {
    return this.makeQRequest(endpoint, HTTP_METHOD.GET, null, withCredentials);
  }

  public async qpost(
    endpoint: string,
    data: Record<string, any> | null = null,
    withCredentials: boolean = false
  ) {
    return this.makeQRequest(endpoint, HTTP_METHOD.POST, data, withCredentials);
  }

  public async qput(
    endpoint: string,
    data: Record<string, any> | null = null,
    withCredentials: boolean = false
  ) {
    return this.makeQRequest(endpoint, HTTP_METHOD.PUT, data, withCredentials);
  }

  public async qdelete(endpoint: string, withCredentials: boolean = false) {
    return this.makeQRequest(
      endpoint,
      HTTP_METHOD.DELETE,
      null,
      withCredentials
    );
  }
}

const rest = new REST({ baseURL: GOOGLE_SHEET_API_BASEURL });

export default rest;
