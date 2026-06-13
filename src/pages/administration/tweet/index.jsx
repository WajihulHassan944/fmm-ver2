import TweetUploader from "./TweetUploader";

export default function index() {
  return (
    <div className="min-h-screen p-8" style={{paddingLeft:'430px'}}>
      <h1 className="text-2xl font-bold mb-4">Post a Tweet</h1>
      <TweetUploader />
    </div>
  );
}
