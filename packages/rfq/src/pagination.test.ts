import { expect, test } from "vitest";

import { PAGE_SIZE, pageCount, pageWindow, parsePage } from "./pagination";

test("a missing or junk page parameter reads as page one", () => {
  // A hand-edited URL must never produce a NaN skip, which Prisma rejects.
  expect(parsePage(undefined)).toBe(1);
  expect(parsePage("")).toBe(1);
  expect(parsePage("banana")).toBe(1);
  expect(parsePage("0")).toBe(1);
  expect(parsePage("-4")).toBe(1);
});

test("a valid page parameter is honoured", () => {
  expect(parsePage("3")).toBe(3);
});

test("the page window feeds Prisma skip and take", () => {
  expect(pageWindow(1)).toEqual({ skip: 0, take: PAGE_SIZE });
  expect(pageWindow(3)).toEqual({ skip: PAGE_SIZE * 2, take: PAGE_SIZE });
});

test("an empty list still has one page", () => {
  // "Page 1 of 0" would be nonsense on screen.
  expect(pageCount(0)).toBe(1);
});

test("a partial final page counts", () => {
  expect(pageCount(PAGE_SIZE)).toBe(1);
  expect(pageCount(PAGE_SIZE + 1)).toBe(2);
});
