import type { ReactNode } from "react";
import { IGRPAuthCarousel, IGRPAuthForm } from "@igrp/framework-next-ui";

import { carouselItems, loginConfig } from "@/config/login";
import { siteConfig } from "@/config/site";
import { sanitizeRedirectUrl } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const { sliderPosition, texts } = loginConfig;
const { logo, name } = siteConfig;

export default async function AuthPage({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}): Promise<ReactNode> {
  const { callbackUrl } = await searchParams;
  const callbackUrlStr =
    typeof callbackUrl === "string"
      ? callbackUrl
      : Array.isArray(callbackUrl)
        ? callbackUrl[0]
        : undefined;
  const safeCallbackUrl = sanitizeRedirectUrl(
    callbackUrlStr,
    process.env.NEXTAUTH_URL,
    "/",
  );

  return (
    <section className="flex min-h-screen flex-col md:flex-row">
      <div
        className={cn(
          "relative hidden w-full md:block md:w-1/2",
          "lg:order-first hidden lg:block",
          sliderPosition === "right" && "lg:order-last",
        )}
      >
        <IGRPAuthCarousel carouselItems={carouselItems} />
      </div>
      <IGRPAuthForm
        texts={texts}
        logo={logo}
        name={name}
        callbackUrl={safeCallbackUrl}
      />
    </section>
  );
}
