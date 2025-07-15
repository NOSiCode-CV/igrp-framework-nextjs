'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/primitives/button';
const CarouselContext = /*#__PURE__*/React.createContext(null);
function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}
function Carousel(t0) {
  const $ = _c(39);
  let children;
  let className;
  let opts;
  let plugins;
  let props;
  let setApi;
  let t1;
  if ($[0] !== t0) {
    ({
      orientation: t1,
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = children;
    $[2] = className;
    $[3] = opts;
    $[4] = plugins;
    $[5] = props;
    $[6] = setApi;
    $[7] = t1;
  } else {
    children = $[1];
    className = $[2];
    opts = $[3];
    plugins = $[4];
    props = $[5];
    setApi = $[6];
    t1 = $[7];
  }
  const orientation = t1 === undefined ? "horizontal" : t1;
  const t2 = orientation === "horizontal" ? "x" : "y";
  let t3;
  if ($[8] !== opts || $[9] !== t2) {
    t3 = {
      ...opts,
      axis: t2
    };
    $[8] = opts;
    $[9] = t2;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  const [carouselRef, api] = useEmblaCarousel(t3, plugins);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  let t4;
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = api_0 => {
      if (!api_0) {
        return;
      }
      setCanScrollPrev(api_0.canScrollPrev());
      setCanScrollNext(api_0.canScrollNext());
    };
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  const onSelect = t4;
  let t5;
  if ($[12] !== api) {
    t5 = () => {
      api?.scrollPrev();
    };
    $[12] = api;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  const scrollPrev = t5;
  let t6;
  if ($[14] !== api) {
    t6 = () => {
      api?.scrollNext();
    };
    $[14] = api;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  const scrollNext = t6;
  let t7;
  if ($[16] !== scrollNext || $[17] !== scrollPrev) {
    t7 = event => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      }
    };
    $[16] = scrollNext;
    $[17] = scrollPrev;
    $[18] = t7;
  } else {
    t7 = $[18];
  }
  const handleKeyDown = t7;
  let t8;
  let t9;
  if ($[19] !== api || $[20] !== setApi) {
    t8 = () => {
      if (!api || !setApi) {
        return;
      }
      setApi(api);
    };
    t9 = [api, setApi];
    $[19] = api;
    $[20] = setApi;
    $[21] = t8;
    $[22] = t9;
  } else {
    t8 = $[21];
    t9 = $[22];
  }
  React.useEffect(t8, t9);
  let t10;
  let t11;
  if ($[23] !== api) {
    t10 = () => {
      if (!api) {
        return;
      }
      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);
      return () => {
        api?.off("select", onSelect);
      };
    };
    t11 = [api, onSelect];
    $[23] = api;
    $[24] = t10;
    $[25] = t11;
  } else {
    t10 = $[24];
    t11 = $[25];
  }
  React.useEffect(t10, t11);
  const t12 = orientation || (opts?.axis === "y" ? "vertical" : "horizontal");
  let t13;
  if ($[26] !== api || $[27] !== canScrollNext || $[28] !== canScrollPrev || $[29] !== carouselRef || $[30] !== children || $[31] !== className || $[32] !== handleKeyDown || $[33] !== opts || $[34] !== props || $[35] !== scrollNext || $[36] !== scrollPrev || $[37] !== t12) {
    t13 = _jsx(CarouselContext.Provider, {
      value: {
        carouselRef,
        api,
        opts,
        orientation: t12,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext
      },
      children: _jsx("div", {
        onKeyDownCapture: handleKeyDown,
        className: cn("relative", className),
        role: "region",
        "aria-roledescription": "carousel",
        "data-slot": "carousel",
        ...props,
        children
      })
    });
    $[26] = api;
    $[27] = canScrollNext;
    $[28] = canScrollPrev;
    $[29] = carouselRef;
    $[30] = children;
    $[31] = className;
    $[32] = handleKeyDown;
    $[33] = opts;
    $[34] = props;
    $[35] = scrollNext;
    $[36] = scrollPrev;
    $[37] = t12;
    $[38] = t13;
  } else {
    t13 = $[38];
  }
  return t13;
}
function CarouselContent(t0) {
  const $ = _c(8);
  let className;
  let props;
  if ($[0] !== t0) {
    ({
      className,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = props;
  } else {
    className = $[1];
    props = $[2];
  }
  const {
    carouselRef,
    orientation
  } = useCarousel();
  const t1 = orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col";
  let t2;
  if ($[3] !== carouselRef || $[4] !== className || $[5] !== props || $[6] !== t1) {
    t2 = _jsx("div", {
      ref: carouselRef,
      className: "overflow-hidden",
      "data-slot": "carousel-content",
      children: _jsx("div", {
        className: cn("flex", t1, className),
        ...props
      })
    });
    $[3] = carouselRef;
    $[4] = className;
    $[5] = props;
    $[6] = t1;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}
function CarouselItem(t0) {
  const $ = _c(7);
  let className;
  let props;
  if ($[0] !== t0) {
    ({
      className,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = props;
  } else {
    className = $[1];
    props = $[2];
  }
  const {
    orientation
  } = useCarousel();
  const t1 = orientation === "horizontal" ? "pl-4" : "pt-4";
  let t2;
  if ($[3] !== className || $[4] !== props || $[5] !== t1) {
    t2 = _jsx("div", {
      role: "group",
      "aria-roledescription": "slide",
      "data-slot": "carousel-item",
      className: cn("min-w-0 shrink-0 grow-0 basis-full", t1, className),
      ...props
    });
    $[3] = className;
    $[4] = props;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}
function CarouselPrevious(t0) {
  const $ = _c(13);
  let className;
  let props;
  let t1;
  let t2;
  if ($[0] !== t0) {
    ({
      className,
      variant: t1,
      size: t2,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = props;
    $[3] = t1;
    $[4] = t2;
  } else {
    className = $[1];
    props = $[2];
    t1 = $[3];
    t2 = $[4];
  }
  const variant = t1 === undefined ? "outline" : t1;
  const size = t2 === undefined ? "icon" : t2;
  const {
    orientation,
    scrollPrev,
    canScrollPrev
  } = useCarousel();
  const t3 = orientation === "horizontal" ? "top-1/2 -left-12 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2 rotate-90";
  let t4;
  if ($[5] !== canScrollPrev || $[6] !== className || $[7] !== props || $[8] !== scrollPrev || $[9] !== size || $[10] !== t3 || $[11] !== variant) {
    t4 = _jsxs(Button, {
      "data-slot": "carousel-previous",
      variant,
      size,
      className: cn("absolute size-8 rounded-full", t3, className),
      disabled: !canScrollPrev,
      onClick: scrollPrev,
      ...props,
      children: [_jsx(ArrowLeft, {}), _jsx("span", {
        className: "sr-only",
        children: "Previous slide"
      })]
    });
    $[5] = canScrollPrev;
    $[6] = className;
    $[7] = props;
    $[8] = scrollPrev;
    $[9] = size;
    $[10] = t3;
    $[11] = variant;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  return t4;
}
function CarouselNext(t0) {
  const $ = _c(13);
  let className;
  let props;
  let t1;
  let t2;
  if ($[0] !== t0) {
    ({
      className,
      variant: t1,
      size: t2,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = props;
    $[3] = t1;
    $[4] = t2;
  } else {
    className = $[1];
    props = $[2];
    t1 = $[3];
    t2 = $[4];
  }
  const variant = t1 === undefined ? "outline" : t1;
  const size = t2 === undefined ? "icon" : t2;
  const {
    orientation,
    scrollNext,
    canScrollNext
  } = useCarousel();
  const t3 = orientation === "horizontal" ? "top-1/2 -right-12 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90";
  let t4;
  if ($[5] !== canScrollNext || $[6] !== className || $[7] !== props || $[8] !== scrollNext || $[9] !== size || $[10] !== t3 || $[11] !== variant) {
    t4 = _jsxs(Button, {
      "data-slot": "carousel-next",
      variant,
      size,
      className: cn("absolute size-8 rounded-full", t3, className),
      disabled: !canScrollNext,
      onClick: scrollNext,
      ...props,
      children: [_jsx(ArrowRight, {}), _jsx("span", {
        className: "sr-only",
        children: "Next slide"
      })]
    });
    $[5] = canScrollNext;
    $[6] = className;
    $[7] = props;
    $[8] = scrollNext;
    $[9] = size;
    $[10] = t3;
    $[11] = variant;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  return t4;
}
export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
//# sourceMappingURL=carousel.js.map