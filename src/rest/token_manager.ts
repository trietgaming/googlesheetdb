// TODO: caching access token
import { REST } from "./REST";

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface OAuthTokenErrorResponse {
  error: string;
  error_description: string;
  error_uri: string;
}

// enum OAuthTokenError {
//   /** The request is missing a parameter so the server can’t proceed with the request. This may also be returned if the request includes an unsupported parameter or repeats a parameter. */
//   INVALID_REQUEST = "invalid_request",
//   /** Client authentication failed, such as if the request contains an invalid client ID or secret. Send an HTTP 401 response in this case. */
//   INVALID_CLIENT = "invalid_client",
//   /** The authorization code (or user’s password for the password grant type) is invalid or expired. This is also the error you would return if the redirect URL given in the authorization grant does not match the URL provided in this access token request. */
//   INVALID_GRANT = "invalid_grant",
//   /** For access token requests that include a scope (password or client_credentials grants), this error indicates an invalid scope value in the request. */
//   INVALID_SCOPE = "invalid_scope",
//   /** This client is not authorized to use the requested grant type. For example, if you restrict which applications can use the Implicit grant, you would return this error for the other apps. */
//   UNAUTHORIZED_CLIENT = "unauthorized_client",
//   /** If a grant type is requested that the authorization server doesn’t recognize, use this code. Note that unknown grant types also use this specific error code rather than using the invalid_request above. */
//   UNSUPPORTED_GRANT_TYPE = "unsupported_grant_type",
// }

// interface TokenManagerOptions {
//   /** Url to exchange access token with refresh token */
//   getTokenUrl?: string;
// }

type TokenRequestFunction = (rest: REST) => Promise<OAuthTokenResponse>;

export default class TokenManager {
  private _accessToken?: string;
  private _pendingTokenRenewal?: number;
  private rest: REST;

  /** Your function that request to server in order to return an access token response */
  private _tokenRequestFunction?: TokenRequestFunction;

  constructor(restService: REST) {
    this.rest = restService;
  }

  public async init() {
    return await this.renewToken();
  }

  public setAccessToken(
    payload: OAuthTokenResponse | string,
    autoUpdate: boolean = true
  ) {
    if (typeof payload === "string") return (this._accessToken = payload);

    this._accessToken = payload.access_token;

    if (autoUpdate && payload.expires_in) {
      // tolerate 2 seconds for request time
      this._pendingTokenRenewal = setTimeout(
        this.renewToken.bind(this),
        payload.expires_in - 2
      ) as unknown as number;
    }
  }

  /** Replace current access token with a new valid access token using refresh token */
  public async renewToken() {
    if (!this._tokenRequestFunction) return;

    const payload = await this._tokenRequestFunction(this.rest);

    if (!payload.access_token) {
      // TODO: handle this error throw
      throw new Error(
        "No Access token in response when getting a new access token!"
      );
    }

    this.setAccessToken(payload);
  }

  public setRenewFunction(func: TokenRequestFunction) {
    this._tokenRequestFunction = func;
  }

  get accessToken() {
    return this._accessToken;
  }
}
