import React from 'react';
import { firstVerifiedPhoto, rejectFightPhoto } from '@/Utils/mobileFightPhotos.cjs';
import { resolvePublicMediaUrl } from '@/Utils/publicApi';

const candidatesFor = (event, fight, side, libraryPhoto) => {
  const record = [fight[`fighter${side}`], fight[`fighter${side}Id`], fight[side === 'A' ? 'fighterOne' : 'fighterTwo']].find(value => value && typeof value === 'object') || {};
  return [
    event[`fighter${side}Image`], libraryPhoto,
    fight[`resolvedFighter${side}Image`], fight[`fighter${side}PrimaryImage`],
    fight[`fighter${side}Image`], fight[`fighter${side}ImageUrl`],
    record.primaryImage, record.resolvedImage, record.imageUrl, record.profileImage,
    record.fighterImage, record.image, record.imageHealth?.url,
    fight[side === 'A' ? 'fighter1Image' : 'fighter2Image'],
    fight[side === 'A' ? 'matchFighterAImage' : 'matchFighterBImage'],
    fight[side === 'A' ? 'fighterOneImage' : 'fighterTwoImage'],
    event[`featuredFightFighter${side}Image`],
  ].filter(value => typeof value === 'string' && value.trim()).map(resolvePublicMediaUrl);
};

// This guard is used only by the Upcoming Events picture strip. It does not
// change the shared feed, other sections, event metadata, or action handlers.
export default function UpcomingFightPhotos({ event, fight = {}, libraryA, libraryB, children }) {
  const sourceKey = JSON.stringify({
    poster: event.hasPoster ? event.image : '',
    a: candidatesFor(event, fight, 'A', libraryA),
    b: candidatesFor(event, fight, 'B', libraryB),
  });
  const sources = React.useMemo(() => JSON.parse(sourceKey), [sourceKey]);
  const [revision, setRevision] = React.useState(0);
  const [checked, setChecked] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const poster = await firstVerifiedPhoto([sources.poster]);
      if (poster) return { image: poster, hasPoster: true };
      const [fighterAImage, fighterBImage] = await Promise.all([
        firstVerifiedPhoto(sources.a), firstVerifiedPhoto(sources.b),
      ]);
      return fighterAImage && fighterBImage ? { hasPoster: false, fighterAImage, fighterBImage } : null;
    };
    check().then(photos => {
      if (!cancelled) setChecked({ sources, revision, photos });
    }).catch(() => {
      if (!cancelled) setChecked({ sources, revision, photos: null });
    });
    return () => { cancelled = true; };
  }, [sources, revision]);
  const onImageError = React.useCallback((url) => {
    rejectFightPhoto(url);
    setRevision(value => value + 1);
  }, []);
  if (!checked || checked.sources !== sources || checked.revision !== revision || !checked.photos) return null;
  return children({ ...checked.photos, onImageError });
}
