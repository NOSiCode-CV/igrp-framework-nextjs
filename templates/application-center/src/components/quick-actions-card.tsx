import Link from 'next/link';
import { LucideProps } from 'lucide-react';

import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickActionsCardProps {
  title: string;
  description: string;
  icon: React.ElementType<LucideProps>;
  btnLbl: string;
  href: string;
}

export function QuickActionsCard({
  title,
  description,
  icon: Icon,
  btnLbl,
  href,
}: QuickActionsCardProps) {
  return (
    <Card className='card-hover'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          asChild
          className='w-full'
        >
          <Link href={href}>
            <Icon strokeWidth={2} /> {btnLbl}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
