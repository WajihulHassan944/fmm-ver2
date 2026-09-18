const SocialAiBot = () => null;

export const getServerSideProps = async () => ({
  redirect: {
    destination: '/administration/swarm?tab=create&jobType=social.multi-platform-daily-posts',
    permanent: false,
  },
});

export default SocialAiBot;
