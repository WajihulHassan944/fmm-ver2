import dynamic from 'next/dynamic';

const HomeAnother = dynamic(
  () => import('@/Components/HomeAnother/HomeAnother'),
  {
    loading: () => <p>Loading...</p>,
  }
);

const HomePage = () => <HomeAnother />;

export default HomePage;
