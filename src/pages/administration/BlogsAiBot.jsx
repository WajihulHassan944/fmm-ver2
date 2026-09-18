const BlogsAiBot = () => null;

export const getServerSideProps = async () => ({
  redirect: {
    destination: '/administration/swarm?tab=create&jobType=content.article',
    permanent: false,
  },
});

export default BlogsAiBot;
