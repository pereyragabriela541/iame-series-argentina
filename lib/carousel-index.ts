export function activeCarouselIndex(
  scrollLeft: number,
  maxScroll: number,
  cardOffsets: number[],
): number {
  if (cardOffsets.length === 0) return 0;
  if (maxScroll <= 1) return 0;
  if (scrollLeft >= maxScroll - 8) return cardOffsets.length - 1;

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  cardOffsets.forEach((offset, index) => {
    const distance = Math.abs(offset - scrollLeft);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  return closestIndex;
}

export function carouselLayout(width: number): { cardWidth: string; endPad: string } {
  if (width >= 1024) {
    return {
      cardWidth: "calc(33.333% - 0.667rem)",
      endPad: "calc(66.666% + 0.667rem)",
    };
  }
  if (width >= 640) {
    return {
      cardWidth: "calc(50% - 0.5rem)",
      endPad: "calc(50% + 0.5rem)",
    };
  }
  return { cardWidth: "85%", endPad: "15%" };
}
