import { StateProfileView } from "@/components/state-profile-view";
import { getStateProfile } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

type StatePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StatePage({ params }: StatePageProps) {
  const { slug } = await params;
  const profile = await getStateProfile(slug);

  return <StateProfileView profile={profile} />;
}
