import { SiteHeader } from '@/components/layout/site-header';

// Puts the small logo header above every /characters screen: the profile, its not-found and its
// error page.
export default function CharactersLayout({ children }: LayoutProps<'/characters'>) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
