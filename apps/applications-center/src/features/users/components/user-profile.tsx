'use client';

import Image from 'next/image';
import {
  IGRPButtonPrimitive,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPUserAvatar,
  IGRPIcon,
  IGRPTabsPrimitive,
  IGRPTabsContentPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPCardDescription,
  IGRPCardDescriptionPrimitive,
  IGRPTabsTriggerPrimitive,
  IGRPTabsListPrimitive,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';
import {
  useCurrentUser,
  useRemoveUserRole,
  // useUserImage,
  // useUserSignature,
  useUserRoles,
} from '@/features/users/use-users';
import { getInitials } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { ROUTES } from '@/lib/constants';
import { AppCenterLoading } from '@/components/loading';
import { ButtonLink } from '@/components/button-link';
import { AppCenterNotFound } from '@/components/not-found';

export function UserProfile() {
  const { data: user, isLoading, error: userError } = useCurrentUser();
  const { data: userRoles } = useUserRoles(user?.username);
  // const { data: getImage } = useUserImage();
  // const { data: getSignature } = useUserSignature();

  const { mutateAsync: removeUserRole } = useRemoveUserRole();

  const { igrpToast } = useIGRPToast();


  if (isLoading && !user) {
    return <AppCenterLoading descrption='Carregando utilizador...' />;
  }

  if (userError) throw userError;

  if (!user) {
    return (
      <AppCenterNotFound
        iconName='User'
        title='Nenhum utilizador encontrada.'
      />
    );
  }

  const handleRevokeRole = async (name: string) => {
    if (!name) return;

    try {
      await removeUserRole({ username: user.username, roleNames: [name] });
      igrpToast({
        type: 'success',
        title: 'Perfil removido com sucesso.',
      });

    } catch (error) {
      igrpToast({
        type: 'error',
        title: 'Não foi possivel remover o perfil.',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
      });      
    }
  }

  return (
    <div className='flex flex-col gap-10 animate-fade-in'>
      <PageHeader
        title='Perfil do Utilizador'
        showBackButton
        linkBackButton={ROUTES.USERS}
      />

      <div className='space-y-6'>
        <IGRPCardPrimitive className='py-4'>
          <IGRPCardContentPrimitive>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
              <div className='flex gap-2 items-center'>
                <IGRPUserAvatar
                  //image={getImage?.link}
                  alt={user?.username}
                  fallbackContent={user && getInitials(user.username)}
                  className='h-18 w-18 bg-white/80'
                  fallbackClass='text-xl'
                />

                <div className='text-sm'>
                  <h2 className='font-bold mb-1'>{user?.name || 'N/A'}</h2>
                  <p className='text-muted-foreground'>{user?.username}</p>
                </div>
              </div>

              <ButtonLink
                href={`${ROUTES.USER_PROFILE}/${ROUTES.EDIT}`}
                icon='UserPen'
                label='Editar'
              />
            </div>
          </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>

        <div className='flex flex-col gap-6'>
          <IGRPTabsPrimitive
            defaultValue='overview'
            className='w-full'
          >
            <IGRPTabsListPrimitive className='dark:bg-slate-900/50'>
              <IGRPTabsTriggerPrimitive
                value='overview'
                className='dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white'
              >
                Overview
              </IGRPTabsTriggerPrimitive>
              {userRoles && userRoles.length > 0 && (
                <IGRPTabsTriggerPrimitive
                  value='permissions'
                  className='dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white'
                >
                  Permissions
                </IGRPTabsTriggerPrimitive>
              )}
            </IGRPTabsListPrimitive>

            <IGRPTabsContentPrimitive
              value='overview'
              className='space-y-4'
            >
              <IGRPCardPrimitive>
                <IGRPCardHeaderPrimitive>
                  <IGRPCardTitlePrimitive>User Information</IGRPCardTitlePrimitive>
                  <IGRPCardDescriptionPrimitive>Basic information</IGRPCardDescriptionPrimitive>
                </IGRPCardHeaderPrimitive>
                <IGRPCardContentPrimitive>
                  <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm'>
                    <div className='flex flex-col gap-4'>
                      <div>
                        <dt className='font-medium text-muted-foreground'>Full Name</dt>
                        <dd>{user?.name}</dd>
                      </div>
                      <div>
                        <dt className='font-medium text-muted-foreground'>Username</dt>
                        <dd>{user?.username}</dd>
                      </div>
                      <div>
                        <dt className='font-medium text-muted-foreground'>Email</dt>
                        <dd>{user?.email}</dd>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <dt className='font-medium text-muted-foreground'>Signature</dt>
                      {/* <dd>
                        {getSignature?.link ? (
                          <Image
                            src={getSignature.link}
                            alt='Signature preview'
                            className='object-contain h-30 max-w-50 w-full bg-white/80 rounded-md'
                            width={300}
                            height={100}
                          />
                        ) : (
                          'N/A'
                        )}
                      </dd> */}
                    </div>
                  </dl>
                </IGRPCardContentPrimitive>
              </IGRPCardPrimitive>
            </IGRPTabsContentPrimitive>

            {userRoles && userRoles.length > 0 && (
              <IGRPTabsContentPrimitive
                value='permissions'
                className='mt-4'
              >
                <IGRPCardPrimitive>
                  <IGRPCardHeaderPrimitive>
                    <IGRPCardTitlePrimitive>User Permissions</IGRPCardTitlePrimitive>
                    <IGRPCardDescription>Access and permissions</IGRPCardDescription>
                  </IGRPCardHeaderPrimitive>
                  <IGRPCardContentPrimitive>
                    <div className='space-y-4'>
                      {userRoles.map((role, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between rounded-lg border-b p-4'
                        >
                          <div className='flex items-center gap-4'>
                            <div className='rounded-full bg-primary/10 p-2'>
                              <IGRPIcon iconName='Shield' className='text-primary' />
                            </div>
                            <div>
                              <p className='font-medium capitalize'>
                                {role.description}
                              </p>
                            </div>
                          </div>
                          <IGRPButtonPrimitive
                            variant='outline'
                            size='sm'
                            onClick={() => handleRevokeRole(role.name)}
                          >
                            Revoke
                          </IGRPButtonPrimitive>
                        </div>
                      ))}
                    </div>
                  </IGRPCardContentPrimitive>
                </IGRPCardPrimitive>
              </IGRPTabsContentPrimitive>
            )}
          </IGRPTabsPrimitive>
        </div>
      </div>
    </div>
  );
}
