'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/horizon/card';
import {
  IGRPMenuNavigation,
  IGRPMenuNavigationProvider,
  useIGRPMenuNavigation,
  type IGRPMenuNavigationItem,
} from '.';

const sampleSections: IGRPMenuNavigationItem[] = [
  { id: 'section1', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'section2', label: 'Settings', icon: 'Settings' },
  { id: 'section3', label: 'Billing', icon: 'CreditCard' },
  { id: 'section4', label: 'Reports', icon: 'FileText', disabled: true },
];

function NavigationContent() {
  const [activeSection, setActiveSection] = useState('section1');
  const { getSectionRef } = useIGRPMenuNavigation();

  return (
    <div className='relative container mx-auto px-6 py-10'>
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        <div className='lg:col-span-1'>
          <IGRPMenuNavigation
            sections={sampleSections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            title='Main Menu'
            badgeContent='4'
            badgeVariant='outline'
            badgeColor='info'
            showChevron
            isStickyTop
          />
        </div>

        <div className='lg:col-span-3 space-y-6'>
          <div
            ref={getSectionRef('section1')}
            data-section-id='section1'
          >
            <Card>
              <CardHeader>
                <CardTitle>Overview - Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien
                  vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.
                  Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec
                  metus bibendum egestas.
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            ref={getSectionRef('section2')}
            data-section-id='section2'
          >
            <Card>
              <CardHeader>
                <CardTitle>Settings - Sector de Actividade/SOAT</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien
                  vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.
                  Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec
                  metus bibendum egestas.
                </p>
                <br />
                <p>
                  Additional content to make this section longer for better scroll demonstration.
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            ref={getSectionRef('section3')}
            data-section-id='section3'
          >
            <Card>
              <CardHeader>
                <CardTitle>Billing - Endereços</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien
                  vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.
                  Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec
                  metus bibendum egestas.
                </p>
                <br />
                <p>
                  Additional content to make this section longer for better scroll demonstration.
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            ref={getSectionRef('section4')}
            data-section-id='section4'
          >
            <Card>
              <CardHeader>
                <CardTitle>Reports - Contactos</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien
                  vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.
                  Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec
                  metus bibendum egestas.
                </p>
                <br />
                <p>
                  Additional content to make this section longer for better scroll demonstration.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IGRPNavigationExample() {
  return (
    <IGRPMenuNavigationProvider>
      <NavigationContent />
    </IGRPMenuNavigationProvider>
  );
}
