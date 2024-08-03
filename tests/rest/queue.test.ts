import { test, expect } from "@jest/globals";
import { REST } from "../../src/rest/REST";
import RequestQueue from "../../src/rest/request_queue";

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const executeRequestMock = jest
  .spyOn(REST, "_executeRequest")
  /// @ts-ignore
  .mockImplementation(async (request: Request) => {
    //@ts-ignore
    await sleep(request.ms);
    //@ts-ignore
    return { ok: true, id: request.id };
  });

function randRange(a: number, b: number) {
  return a + Math.random() * b;
}

describe("Queue Testing", () => {
  test("if queue basically works", async () => {
    const queue = new RequestQueue();
    const req1 = { ms: 1000, id: 1 };
    const req2 = { ms: 200, id: 2 };
    const req3 = { ms: 500, id: 3 };

    const completedOrder: number[] = [];

    const onCompleted = (res: Response) => {
      //@ts-ignore
      const resId = res.id;
      completedOrder.push(resId);
      return res;
    };

    //@ts-ignore
    const op1 = queue.enqueue(req1)?.then(onCompleted);
    //@ts-ignore
    const op2 = queue.enqueue(req2)?.then(onCompleted);
    //@ts-ignore
    const op3 = queue.enqueue(req3)?.then(onCompleted);

    (await Promise.all([op1, op2, op3])).forEach((res, ind) => {
      // console.log(res);
      //@ts-ignore
      expect(res.id).toBe(ind + 1);
    });

    expect(executeRequestMock).toHaveBeenCalled();
    expect(completedOrder).toStrictEqual([1, 2, 3]);
  });

  test("Random request", async () => {
    const queue = new RequestQueue();
    const requestNum = 1000;
    const requests = Array(1000)
      .fill(null)
      .map((v, ind) => ({ id: ind, ms: randRange(1, 10) }));

    const completedOrder: number[] = [];

    const onCompleted = (res: Response) => {
      //@ts-ignore
      const resId = res.id;
      completedOrder.push(resId);
      return res;
    };

    // @ts-ignore
    const opts = requests.map((req) => queue.enqueue(req).then(onCompleted));

    (await Promise.all(opts)).forEach((res, ind) => {
      //@ts-ignore
      expect(res.id).toBe(ind);
    });

    const expectedOrder = [];
    for (let i = 0; i < requestNum; ++i) expectedOrder.push(i);

    expect(executeRequestMock).toHaveBeenCalled();
    expect(completedOrder).toStrictEqual(expectedOrder);
  }, 20000);
});
