import Link from 'next/link';
import { render, screen, within } from '@testing-library/react';
import { BreadcrumbItem } from '@/components/layout/breadcrumb-item';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders a labelled trail that ends at the current page', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem>
          <Link href="/">Characters</Link>
        </BreadcrumbItem>
        <BreadcrumbItem current>Rick Sanchez</BreadcrumbItem>
      </Breadcrumbs>,
    );

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const items = within(nav).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByRole('link', { name: 'Characters' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(within(items[1]!).getByText('Rick Sanchez')).toHaveAttribute('aria-current', 'page');
  });
});
