export const getClassString = el => {
  const cnProp = el.className;
  if (typeof cnProp === "string") return cnProp;
  if (cnProp && typeof cnProp === "object" && "baseVal" in cnProp) {
    return cnProp.baseVal;
  }
  return "";
};
//# sourceMappingURL=class-utils.js.map