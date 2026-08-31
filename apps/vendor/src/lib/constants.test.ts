import { expect, test } from "vitest";

import {
  expiredCookieOptions,
  VENDOR_LOGIN_EXPIRED_PATH,
  VENDOR_LOGIN_PATH,
  VENDOR_SESSION_EXPIRED_PARAM,
  vendorCookieOptions,
} from "./constants";

test("the expired-login path is the login path carrying the marker the proxy looks for", () => {
  const url = new URL(VENDOR_LOGIN_EXPIRED_PATH, "http://localhost");

  expect(url.pathname).toBe(VENDOR_LOGIN_PATH);
  // The proxy branches on this parameter; a mismatch silently restores the loop.
  expect(url.searchParams.has(VENDOR_SESSION_EXPIRED_PARAM)).toBe(true);
});

test("expired options clear the cookie and match the live cookie's scope", () => {
  const live = vendorCookieOptions();
  const dead = expiredCookieOptions();

  // maxAge 0 is what actually removes it from the browser.
  expect(dead.maxAge).toBe(0);

  // A mismatched path or domain writes a second cookie instead of clearing the first.
  expect(dead.path).toBe(live.path);
  expect(dead.httpOnly).toBe(live.httpOnly);
  expect(dead.sameSite).toBe(live.sameSite);
  expect(dead.secure).toBe(live.secure);
});
