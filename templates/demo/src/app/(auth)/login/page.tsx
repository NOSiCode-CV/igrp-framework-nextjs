import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { getAuthProviderIdFromEnv } from "@igrp/framework-next-auth";
import { IGRPAuthForm } from "@igrp/framework-next-ui";

import { carouselItems, loginConfig } from "@/config/login";
import { siteConfig } from "@/config/site";
import { sanitizeRedirectUrl } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const IGRPAuthCarousel = dynamic(
  () => import("@igrp/framework-next-ui").then((mod) => mod.IGRPAuthCarousel),
  {
    ssr: true,
    loading: () => (
      <div
        className="min-h-[400px] bg-muted rounded-lg motion-reduce:animate-none motion-safe:animate-pulse"
        aria-hidden="true"
      />
    ),
  },
);

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
  const providerId = getAuthProviderIdFromEnv(process.env);

  return (
    <section
      className="flex min-h-screen flex-col md:flex-row"
      aria-label="Página de início de sessão"
    >
      <a
        href="#main-content"
        className="sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:m-4 focus-visible:inline-block focus-visible:h-auto focus-visible:w-auto focus-visible:overflow-visible focus-visible:[clip:auto] focus-visible:rounded focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Saltar para o conteúdo
      </a>
      <div
        className={cn(
          "relative hidden w-full md:block md:w-1/2",
          "lg:order-first hidden lg:block",
          sliderPosition === "right" && "lg:order-last",
        )}
      >
        <IGRPAuthCarousel carouselItems={carouselItems} />
      </div>
      <div id="main-content" className="scroll-mt-4">
        <IGRPAuthForm
          texts={texts}
          logo={logo}
          name={name}
          callbackUrl={safeCallbackUrl}
          providerId={providerId}
        />
      </div>
    </section>
  );
}
