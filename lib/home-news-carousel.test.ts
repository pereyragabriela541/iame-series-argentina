import assert from "node:assert/strict";
import test from "node:test";
import { activeCarouselIndex, carouselLayout } from "./carousel-index";

test("carousel stays on the first card when everything fits", () => {
  assert.equal(activeCarouselIndex(0, 0, [0, 320, 640, 960]), 0);
});

test("carousel marks the last card when scrolled to the end", () => {
  assert.equal(activeCarouselIndex(500, 500, [0, 200, 400, 500]), 3);
  assert.equal(activeCarouselIndex(493, 500, [0, 200, 400, 500]), 3);
});

test("carousel picks the closest card while scrolling", () => {
  assert.equal(activeCarouselIndex(10, 500, [0, 200, 400, 500]), 0);
  assert.equal(activeCarouselIndex(210, 500, [0, 200, 400, 500]), 1);
  assert.equal(activeCarouselIndex(390, 500, [0, 200, 400, 500]), 2);
});

test("carousel layout stays compact on phone and shows more cards on desktop", () => {
  assert.deepEqual(carouselLayout(390), { cardWidth: "85%", endPad: "15%" });
  assert.equal(carouselLayout(800).cardWidth, "calc(50% - 0.5rem)");
  assert.equal(carouselLayout(1280).cardWidth, "calc(33.333% - 0.667rem)");
});
