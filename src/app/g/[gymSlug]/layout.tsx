import { getTenantBySlug } from "@/features/tenants/queries";
import { hexToHslComponents } from "@/lib/utils/color";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { GymBottomNav } from "@/components/gym/GymBottomNav";

interface GymLayoutProps {
  children: React.ReactNode;
  params: Promise<{ gymSlug: string }>;
}

export default async function GymLayout({ children, params }: GymLayoutProps) {
  const { gymSlug } = await params;
  const tenant = await getTenantBySlug(gymSlug);

  // Apply custom primary color if the tenant has one configured
  const hsl = tenant?.primaryColor ? hexToHslComponents(tenant.primaryColor) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {hsl && (
        <style>{`:root { --primary: ${hsl}; --ring: ${hsl}; }`}</style>
      )}
      {children}
      <PwaInstallBanner />
      {/* App-style bottom navigation — hides itself on session pages */}
      <GymBottomNav gymSlug={gymSlug} />
    </div>
  );
}
