'use client';

import { createContext, use, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  IGRP_AUTH_PROVIDER_ID,
  signIn,
  type AuthProviderId,
} from '@igrp/framework-next-auth/client';
import { cn, Alert, AlertDescription, Button } from '@igrp/igrp-framework-react-design-system';
import { AlertCircleIcon, LoaderIcon, ShieldCheckIcon } from 'lucide-react';
import { useIGRPBranding } from '../branding/provider.js';
import { resolveWideLogo } from '../branding/resolve.js';
import { IGRPTemplateImage } from '../templates/template-image.js';
import { IGRPTemplateModeSwitcher } from '../templates/mode-switcher.js';
import { useIGRPChromeI18n } from '../i18n/context.js';
import { withBasePath } from '../lib/utils.js';

interface IGRPLoginTexts {
  welcome: string;
  description: string;
  /** Primary action label. Defaults to the chrome catalog. */
  loginButton?: string;
  copyright: string;
  igrpLabel: string;
  igrpUrl: string;
  nosiLabel: string;
  nosiUrl: string;
  /** Shown when `signIn()` rejects before it can redirect. Defaults to the chrome catalog. */
  signInError?: string;
  /** Word between the two footer links. Defaults to the chrome catalog. */
  footerJoin?: string;
}

interface IGRPSiteLogo {
  src: string;
  srcDark?: string;
  width: number;
  height: number;
}

interface IGRPAuthFormProps {
  texts: IGRPLoginTexts;
  logo: IGRPSiteLogo;
  name: string;
  callbackUrl?: string;
  providerId?: AuthProviderId;
}

type AuthFormContextValue = {
  /** Provider whose sign-in is in flight, or `null`. Every button is disabled while one is. */
  pendingProviderId: AuthProviderId | null;
  error: string | null;
  signIn: (providerId: AuthProviderId, callbackUrl: string) => void;
};

const AuthFormContext = createContext<AuthFormContextValue | null>(null);

function useAuthFormContext(part: string): AuthFormContextValue {
  const ctx = use(AuthFormContext);
  if (!ctx) throw new Error(`${part} must be rendered inside <IGRPAuthFormRoot>`);
  return ctx;
}

interface IGRPAuthFormRootProps {
  children: ReactNode;
  /** Shown when `signIn()` rejects before it can redirect. Defaults to the chrome catalog. */
  signInError?: string;
  className?: string;
}

/**
 * The login panel: owns the sign-in loading/error state its parts share and
 * renders the theme switcher row. Put {@link IGRPAuthFormBody} and
 * {@link IGRPAuthFormFooter} inside it.
 */
function IGRPAuthFormRoot({ children, signInError, className }: IGRPAuthFormRootProps) {
  const [pendingProviderId, setPendingProviderId] = useState<AuthProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chrome = useIGRPChromeI18n();

  // NO `finally` CLAUSE HERE. Two independent reasons, both easy to undo by
  // accident:
  //
  // 1. `babel-plugin-react-compiler` (through 1.0.0) cannot lower a
  //    `TryStatement` with a finalizer — "Todo: (BuildHIR::lowerStatement)".
  //    It swallows that per function and emits the module UNCOMPILED, so the
  //    build stays green while this component silently loses memoization.
  //    Verify with: `grep -l compiler-runtime dist/auths/form.js`.
  // 2. On the happy path `signIn()` never resolves — it navigates away. Clearing
  //    the flag there un-spins the button mid-redirect.
  //
  // The flag is therefore cleared only on the failure path, where the component
  // is still mounted and the user needs the button back.
  async function startSignIn(providerId: AuthProviderId, callbackUrl: string) {
    setPendingProviderId(providerId);
    setError(null);

    try {
      await signIn(providerId, { callbackUrl });
    } catch (err) {
      console.error('Authentication error:', err);
      setError(signInError ?? chrome.authForm.signInError);
      setPendingProviderId(null);
    }
  }

  return (
    <AuthFormContext value={{ pendingProviderId, error, signIn: startSignIn }}>
      <div
        className={cn('flex flex-col w-full h-screen bg-ring/10 p-8 md:w-1/2 gap-10', className)}
      >
        <div className={cn('flex justify-end')}>
          <IGRPTemplateModeSwitcher />
        </div>
        {children}
      </div>
    </AuthFormContext>
  );
}

interface IGRPAuthFormBodyProps {
  children: ReactNode;
  className?: string;
}

/** The centred column that holds the logo, heading, error and sign-in buttons. */
function IGRPAuthFormBody({ children, className }: IGRPAuthFormBodyProps) {
  return (
    <div className={cn('grow flex flex-col justify-center items-center')}>
      <div className={cn('w-full max-w-md space-y-8 flex flex-col justify-center', className)}>
        {children}
      </div>
    </div>
  );
}

interface IGRPAuthFormLogoProps {
  logo: IGRPSiteLogo;
  /** Alt text. */
  name: string;
}

/** The brand's wide logo (light and dark variants), falling back to `logo`. */
function IGRPAuthFormLogo({ logo, name }: IGRPAuthFormLogoProps) {
  // Brand wide logo with its size, else the app's own logo.
  const wide = resolveWideLogo({ branding: useIGRPBranding(), fallback: logo });

  return (
    <>
      <IGRPTemplateImage
        src={withBasePath(wide.src)}
        alt={name}
        width={wide.width}
        height={wide.height}
        className={cn('w-auto h-auto max-h-20', wide.srcDark && 'dark:hidden')}
        fallback={
          <Image
            src={withBasePath(logo.src)}
            alt={name}
            width={logo.width}
            height={logo.height}
            className={cn('w-auto h-auto max-h-20', wide.srcDark && 'dark:hidden')}
          />
        }
      />
      {wide.srcDark && (
        <IGRPTemplateImage
          src={withBasePath(wide.srcDark)}
          alt={name}
          width={wide.width}
          height={wide.height}
          className={cn('w-auto h-auto max-h-20 hidden dark:block')}
          fallback={
            <Image
              src={withBasePath(logo.srcDark ?? logo.src)}
              alt={name}
              width={logo.width}
              height={logo.height}
              className={cn('w-auto h-auto max-h-20 hidden dark:block')}
            />
          }
        />
      )}
    </>
  );
}

interface IGRPAuthFormHeadingProps {
  title: ReactNode;
  description?: ReactNode;
}

function IGRPAuthFormHeading({ title, description }: IGRPAuthFormHeadingProps) {
  return (
    <div className={cn('mt-6 text-center')}>
      {/* `<p>` inside `<h3>` is invalid: the parser closes the heading
          early, so the DOM React hydrates differs from the one it built. */}
      <h3>{title}</h3>
      {description != null && <p>{description}</p>}
    </div>
  );
}

/** The sign-in failure alert; renders nothing until a sign-in fails. */
function IGRPAuthFormError() {
  const { error } = useAuthFormContext('IGRPAuthFormError');
  if (!error) return null;
  return (
    <Alert
      variant="destructive"
      className={cn('animate-in fade-in-50 slide-in-from-top-5')}
      role="alert"
      aria-live="polite"
    >
      <AlertCircleIcon size={16} className={cn('h-4 w-4')} strokeWidth={2} aria-hidden />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

interface IGRPAuthFormSignInButtonProps {
  /** Identity provider to sign in with. Defaults to IGRP. */
  providerId?: AuthProviderId;
  callbackUrl?: string;
  /** Label. Defaults to the chrome catalog's login button. */
  children?: ReactNode;
  /** Trailing icon. Defaults to a shield; `null` for none. */
  icon?: ReactNode;
  className?: string;
}

/**
 * Starts `signIn(providerId)`. Render one per identity provider: while any of
 * them is signing in, all are disabled and the active one spins.
 */
function IGRPAuthFormSignInButton({
  providerId = IGRP_AUTH_PROVIDER_ID,
  callbackUrl = '/',
  children,
  icon,
  className,
}: IGRPAuthFormSignInButtonProps) {
  const { pendingProviderId, signIn: startSignIn } = useAuthFormContext('IGRPAuthFormSignInButton');
  const chrome = useIGRPChromeI18n();
  const label = children ?? chrome.authForm.loginButton;
  const isPending = pendingProviderId === providerId;

  return (
    <Button
      onClick={() => startSignIn(providerId, callbackUrl)}
      disabled={pendingProviderId !== null}
      className={cn('h-10 text-md', className)}
      aria-busy={isPending}
    >
      {isPending ? (
        <>
          <LoaderIcon
            size={16}
            className={cn('mr-2 animate-spin motion-reduce:animate-none')}
            strokeWidth={2}
            aria-hidden
          />
          {label}…
        </>
      ) : (
        <>
          {label}
          {icon === undefined ? (
            <ShieldCheckIcon size={16} className={cn('mr-2 size-6')} strokeWidth={2} aria-hidden />
          ) : (
            icon
          )}
        </>
      )}
    </Button>
  );
}

interface IGRPAuthFormFooterProps {
  /** Replaces the default copyright line; the link props are then ignored. */
  children?: ReactNode;
  copyright?: string;
  igrpLabel?: string;
  igrpUrl?: string;
  nosiLabel?: string;
  nosiUrl?: string;
  /** Word between the two links. Defaults to the chrome catalog. */
  footerJoin?: string;
}

function IGRPAuthFormFooter({
  children,
  copyright,
  igrpLabel,
  igrpUrl,
  nosiLabel,
  nosiUrl,
  footerJoin,
}: IGRPAuthFormFooterProps) {
  const chrome = useIGRPChromeI18n();
  return (
    <footer className={cn('text-center text-muted-foreground text-xs')}>
      {children ?? (
        <div className={cn('flex items-center justify-center')}>
          <span>&copy;{new Date().getFullYear()} |&nbsp;</span>
          <span>{copyright}&nbsp;</span>
          <a
            className={cn('font-medium underline underline-offset-4 hover:no-underline')}
            href={igrpUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {igrpLabel}
          </a>
          <span>&nbsp;{footerJoin ?? chrome.authForm.footerJoin}&nbsp;</span>
          <a
            className={cn('font-medium underline underline-offset-4 hover:no-underline')}
            href={nosiUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {nosiLabel}
          </a>
        </div>
      )}
    </footer>
  );
}

/**
 * The default login panel. For another layout or a second identity provider,
 * compose the `IGRPAuthForm*` parts directly; this component is exactly:
 *
 * ```tsx
 * <IGRPAuthFormRoot signInError={texts.signInError}>
 *   <IGRPAuthFormBody>
 *     <IGRPAuthFormError />
 *     <div className="flex flex-col items-center">
 *       <IGRPAuthFormLogo logo={logo} name={name} />
 *       <IGRPAuthFormHeading title={texts.welcome} description={texts.description} />
 *     </div>
 *     <IGRPAuthFormSignInButton providerId={providerId} callbackUrl={callbackUrl}>
 *       {texts.loginButton}
 *     </IGRPAuthFormSignInButton>
 *   </IGRPAuthFormBody>
 *   <IGRPAuthFormFooter copyright={texts.copyright} igrpLabel={…} igrpUrl={…} … />
 * </IGRPAuthFormRoot>
 * ```
 */
function IGRPAuthForm({
  texts,
  logo,
  name,
  callbackUrl = '/',
  providerId = IGRP_AUTH_PROVIDER_ID,
}: IGRPAuthFormProps) {
  return (
    <IGRPAuthFormRoot signInError={texts.signInError}>
      <IGRPAuthFormBody>
        <IGRPAuthFormError />
        <div className={cn('flex flex-col items-center')}>
          <IGRPAuthFormLogo logo={logo} name={name} />
          <IGRPAuthFormHeading title={texts.welcome} description={texts.description} />
        </div>
        <IGRPAuthFormSignInButton providerId={providerId} callbackUrl={callbackUrl}>
          {texts.loginButton}
        </IGRPAuthFormSignInButton>
      </IGRPAuthFormBody>
      <IGRPAuthFormFooter
        copyright={texts.copyright}
        igrpLabel={texts.igrpLabel}
        igrpUrl={texts.igrpUrl}
        nosiLabel={texts.nosiLabel}
        nosiUrl={texts.nosiUrl}
        footerJoin={texts.footerJoin}
      />
    </IGRPAuthFormRoot>
  );
}

export {
  IGRPAuthForm,
  IGRPAuthFormRoot,
  IGRPAuthFormBody,
  IGRPAuthFormLogo,
  IGRPAuthFormHeading,
  IGRPAuthFormError,
  IGRPAuthFormSignInButton,
  IGRPAuthFormFooter,
  type IGRPAuthFormProps,
  type IGRPAuthFormRootProps,
  type IGRPAuthFormBodyProps,
  type IGRPAuthFormLogoProps,
  type IGRPAuthFormHeadingProps,
  type IGRPAuthFormSignInButtonProps,
  type IGRPAuthFormFooterProps,
  type IGRPLoginTexts,
  type IGRPSiteLogo,
};
