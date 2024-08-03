import rest, { REST } from "../../src/rest/REST";
import { log, error } from "console";
import "whatwg-fetch";

import { test, expect } from "@jest/globals";
const testRest = new REST({ baseURL: "" });

describe("Methods working correctly", () => {
  it("should get", async () => {
    expect((await testRest.get("https://httpbin.dev/get")).ok).toBeTruthy();
  });
  it("should post", async () => {
    expect((await testRest.post("https://httpbin.dev/post")).ok).toBeTruthy();
  });
  it("should put", async () => {
    expect((await testRest.put("https://httpbin.dev/put")).ok).toBeTruthy();
  });
  it("should delete", async () => {
    expect((await testRest.delete("https://httpbin.dev/delete")).ok).toBeTruthy();
  });
});
