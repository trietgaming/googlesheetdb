import { HTTPResponse, REST } from "./REST";

type ResolveFunction = (response: HTTPResponse) => void;

class RequestQueueElement {
  public val: Request;
  public next: RequestQueueElement | null;
  public resolve: ResolveFunction;

  constructor(
    _val: Request,
    _next: RequestQueueElement | null,
    _resolveFunc: ResolveFunction
  ) {
    this.val = _val;
    this.next = _next;
    this.resolve = _resolveFunc;
  }
}

export default class RequestQueue {
  private _last: RequestQueueElement | null;

  constructor() {
    this._last = null;
  }

  private async _processElement(element: RequestQueueElement) {
    const response = await REST._executeRequest(element.val);
    // return response for that request (Promise.resolve)
    element.resolve(response);

    // process next element in queue
    if (element.next != null) {
      this._processElement(element.next);
    } else {
      // this is the last element in the queue, so the queue should be empty after this
      this._last = null;
    }
  }

  // TODO: Handle errors

  public async enqueue(request: Request) {
    return new Promise((resolve: ResolveFunction) => {
      const element = new RequestQueueElement(request, null, resolve);

      if (this._last == null) {
        this._last = element;
        this._processElement(element);
      } else {
        this._last.next = element;
        this._last = element;
      }
    });
  }

  public isEmpty() {
    return this._last == null;
  }
}
