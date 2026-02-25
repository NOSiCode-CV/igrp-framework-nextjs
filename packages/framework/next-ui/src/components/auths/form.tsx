'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signIn } from '@igrp/framework-next-auth/client';
import {
  cn,
  IGRPAlertPrimitive,
  IGRPAlertDescriptionPrimitive,
  IGRPButtonPrimitive,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPTemplateModeSwitcher } from '../templates/mode-switcher';

interface IGRPLoginTexts {
  welcome: string;
  description: string;
  loginButton: string;
  copyright: string;
  igrpLabel: string;
  igrpUrl: string;
  nosiLabel: string;
  nosiUrl: string;
}

interface IGRPSiteLogo {
  src: string;
  width: number;
  height: number;
}

interface IGRPAuthFormProps {
  texts: IGRPLoginTexts;
  logo: IGRPSiteLogo;
  name: string;
  callbackUrl?: string;
}

function IGRPAuthForm({ texts, logo, name, callbackUrl = '/' }: IGRPAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function onSubmit() {
    setIsLoading(true);
    setAuthError(null);

    try {
      await signIn('keycloak', { callbackUrl });
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn('flex flex-col w-full h-screen bg-ring/10 p-8 md:w-1/2 gap-10')}>
      <div className={cn('flex justify-end')}>
        <IGRPTemplateModeSwitcher />
      </div>

      <div className={cn('grow flex flex-col justify-center items-center')}>
        <div className={cn('w-full max-w-md space-y-8 flex flex-col justify-center')}>
          {authError && (
            <IGRPAlertPrimitive
              variant="destructive"
              className={cn('animate-in fade-in-50 slide-in-from-top-5')}
            >
              <IGRPIcon iconName="AlertCircle" className={cn('h-4 w-4')} strokeWidth={2} />
              <IGRPAlertDescriptionPrimitive>{authError}</IGRPAlertDescriptionPrimitive>
            </IGRPAlertPrimitive>
          )}
          <div className={cn('flex flex-col items-center')}>
            <Image
              src={logo.src}
              alt={name}
              width={logo.width}
              height={logo.height}
              className={cn('w-auto h-auto')}
            />
            <h3 className={cn('mt-6 text-center')}>
              <p>{texts.welcome}</p>
              <p>{texts.description}</p>
            </h3>
          </div>

          <IGRPButtonPrimitive
            onClick={onSubmit}
            disabled={isLoading}
            className={cn('h-10 text-md')}
            aria-live="polite"
          >
            {isLoading ? (
              <>
                <IGRPIcon iconName="Loader" className={cn('mr-2 animate-spin')} strokeWidth={2} />A
                autenticar...
              </>
            ) : (
              <>
                Autenticar
                <IGRPIcon iconName="ShieldCheck" className={cn('mr-2 size-6')} strokeWidth={2} />
              </>
            )}
          </IGRPButtonPrimitive>
        </div>
      </div>

      <footer className={cn('text-center text-muted-foreground text-xs')}>
        <div className={cn('flex items-center justify-center')}>
          <span>&copy;{new Date().getFullYear()} |&nbsp;</span>
          <span>{texts.copyright}&nbsp;</span>
          <a
            className={cn('font-medium underline underline-offset-4 hover:no-underline')}
            href={texts.igrpUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {texts.igrpLabel}
          </a>
          <span>&nbsp;na&nbsp;</span>
          <a
            className={cn('font-medium underline underline-offset-4 hover:no-underline')}
            href={texts.nosiUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {texts.nosiLabel}
          </a>
        </div>
      </footer>
    </div>
  );
}

export { IGRPAuthForm, type IGRPAuthFormProps, type IGRPLoginTexts, type IGRPSiteLogo };
