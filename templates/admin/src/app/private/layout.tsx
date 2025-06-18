import { Layout } from "@igrp/framework-next";
export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (    
    <Layout>{children}</Layout>
  );
}
