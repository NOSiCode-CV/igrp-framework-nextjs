export const areRectsEqual = (rect1, rect2) => {
  if (!rect1 || !rect2) return rect1 === rect2;
  return rect1.top === rect2.top && rect1.left === rect2.left && rect1.width === rect2.width && rect1.height === rect2.height;
};
export const areInspectorStatesEqual = (state1, state2) => {
  return areRectsEqual(state1.rect, state2.rect) && state1.className === state2.className;
};
export const createInspectorState = (rect, matches) => ({
  rect,
  className: matches.join(" ")
});
export const getEmptyInspectorState = () => ({
  rect: null,
  className: ""
});
//# sourceMappingURL=inspector-state-utils.js.map