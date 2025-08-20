import { loginConfig } from '@/config/login';
import { AuthCarousel } from '@/features/auth/components/carousel';
import { AuthForm } from '@/features/auth/components/form';
import { cn } from '@/lib/utils';

const { sliderPosition } = loginConfig;

export default function AuthPage() {
  return (
    <section className='flex min-h-screen flex-col md:flex-row'>
      <div
        className={cn(
          'relative hidden w-full md:block md:w-1/2',
          'lg:order-first hidden lg:block',
          sliderPosition === 'right' && 'lg:order-last',
        )}
      >
        <AuthCarousel />
      </div>
      <AuthForm />
    </section>
  );
}
