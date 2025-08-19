import { AppsCenterWrapper } from '@/components/wrapper';
import { ApplicationForm } from '@/features/applications/components/form';
import { ROUTES } from '@/lib/constants';

export default function NewApplicationPage() {
  return (
    <AppsCenterWrapper
      title='Criar Aplicação'
      backHref={ROUTES.APPS}
    >
      <ApplicationForm />
    </AppsCenterWrapper>
  );
}
