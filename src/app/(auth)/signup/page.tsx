import { Suspense } from "react";
import { getTenantBySlug } from "@/features/tenants/queries";
import { hexToHslComponents } from "@/lib/utils/color";
import { SignupForm } from "@/components/auth/SignupForm";

interface Props {
  searchParams: Promise<{ next?: string; gym?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const { next, gym } = await searchParams;

  // Detect gym from explicit ?gym= param or by parsing the ?next= URL
  const gymSlug =
    gym ??
    (next?.startsWith("/g/") ? next.split("/")[2]?.split("?")[0] : null) ??
    null;

  const tenant = gymSlug ? await getTenantBySlug(gymSlug) : null;
  const hsl = tenant?.primaryColor
    ? hexToHslComponents(tenant.primaryColor)
    : null;

  return (
    <>
      {hsl && (
        <style>{`:root { --primary: ${hsl}; --ring: ${hsl}; }`}</style>
      )}
      {tenant && (
        <div className="mb-2 flex flex-col items-center gap-1">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {tenant.name}
            </span>
          )}
        </div>
      )}
      <Suspense>
        <SignupForm gymName={tenant?.name} />
      </Suspense>
    </>
  );
}
