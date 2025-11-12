import {
  cn,
  IGRPIcon,
  IGRPText,
} from "@igrp/igrp-framework-react-design-system";
import { DisableDetailsProps } from "../types/customTypes";

export function DisableDetails({ details }: DisableDetailsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-stretch items-center",
      )}
    >
      {details.map((item, index) => (
        <div
          key={index}
          className={cn(
            "flex flex-row flex-nowrap items-center justify-start gap-2 col-span-2",
          )}
        >
          <IGRPIcon name={`icon-${index}`} iconName={item.iconName} size="14" />
          <IGRPText
            name={`label-${index}`}
            variant="primary"
            weight="normal"
            size="default"
            align="left"
            spacing="normal"
            maxLines={3}
            className={cn(
              "mb-0 font-inter text-[13px] leading-6 text-left font-semibold not-italic normal-case",
            )}
          >
            {item.label}:
          </IGRPText>
          <IGRPText
            name={`value-${index}`}
            variant="primary"
            weight="normal"
            size="default"
            align="left"
            spacing="normal"
            maxLines={3}
            className={cn(
              "mb-0 font-inter text-[13px] leading-6 text-left font-normal not-italic normal-case",
            )}
          >
            {item.value}
          </IGRPText>
        </div>
      ))}
    </div>
  );
}
