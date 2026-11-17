import type { Metadata } from "next";

import { IGRPForbidden } from "@igrp/framework-next-ui";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("errors.status"))("403") };
}

export default function Forbidden() {
  return <IGRPForbidden />;
}
