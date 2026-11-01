import RetiredGrowthRedirect from '@/Components/Admin/RetiredGrowthRedirect';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import { GROWTH_ENGINE_V2 } from '@/Utils/adminFeatures';
import TweetUploader from "./TweetUploader";

function LegacyTweet() {
  return (
    <div className="min-h-screen p-8" style={{paddingLeft:'430px'}}>
      <h1 className="text-2xl font-bold mb-4">Post a Tweet</h1>
      <TweetUploader />
    </div>
  );
}

// V2: replaced by Growth Engine Publishing (X posting was never connected). Legacy keeps it.
export default function TweetPage() {
  if (GROWTH_ENGINE_V2) return <AdminPrivateRoute><RetiredGrowthRedirect section="publishing" /></AdminPrivateRoute>;
  return <LegacyTweet />;
}
