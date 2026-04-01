import { StateExplorerControls } from "@/components/state-explorer-controls";
import { StateProfileView } from "@/components/state-profile-view";
import { JURISDICTIONS } from "@/lib/data/jurisdictions";
import { getStateProfile } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

const DEFAULT_STATE_SLUG = "california";

type StatesPageProps = {
  searchParams: Promise<{
    state?: string;
  }>;
};

export default async function StatesPage({ searchParams }: StatesPageProps) {
  const { state } = await searchParams;
  const jurisdictions = [...JURISDICTIONS].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
  const selectedSlug = jurisdictions.some((jurisdiction) => jurisdiction.slug === state)
    ? state ?? DEFAULT_STATE_SLUG
    : DEFAULT_STATE_SLUG;
  const profile = await getStateProfile(selectedSlug);

  return (
    <div className="space-y-6">
      <StateExplorerControls
        jurisdictions={jurisdictions}
        selectedSlug={selectedSlug}
      />
      <StateProfileView profile={profile} showHeading={false} />
    </div>
  );
}
