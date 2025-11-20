import { Button } from '../primitives/button';

// TODO: create this component
// see: https://coss.com/origin/banner

export function IGRPBanner() {
  return (
    // To make the notification fixed, add classes like `fixed bottom-4 inset-x-4` to the container element.
    <div className="z-50 rounded-md border bg-background px-4 py-3 shadow-lg">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <p className="text-sm">
          We use cookies to improve your experience, analyze site usage, and show personalized
          content.
        </p>
        <div className="flex gap-2 max-md:flex-wrap">
          <Button size="sm">Accept</Button>
          <Button variant="outline" size="sm">
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}

import { ArrowRightIcon, Eclipse } from 'lucide-react';

export function IGRPBanner2() {
  return (
    <div className="dark bg-muted px-4 py-3 text-foreground">
      <div className="flex flex-col justify-between gap-2 md:flex-row">
        <div className="flex grow gap-3">
          <Eclipse className="mt-0.5 shrink-0 opacity-60" size={16} aria-hidden="true" />
          <div className="flex grow flex-col justify-between gap-2 md:flex-row md:items-center">
            <p className="text-sm">
              We just added something awesome to make your experience even better.
            </p>
            <a href="#" className="group text-sm font-medium whitespace-nowrap">
              Learn more
              <ArrowRightIcon
                className="ms-1 -mt-0.5 inline-flex opacity-60 transition-transform group-hover:translate-x-0.5"
                size={16}
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
