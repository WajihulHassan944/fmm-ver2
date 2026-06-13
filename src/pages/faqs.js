import Head from 'next/head'
import dynamic from 'next/dynamic'

const FrequentAskedQuestions = dynamic(
  () => import('@/Components/Footer/FrequentAskedQuestions'),
  {
    loading: () => <p>Loading...</p>,
  }
)

const FAQsPage = ({ faqs }) => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is FantasyMMAdness?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "FantasyMMAdness is a prediction game platform for boxing, kickboxing, and bare-knuckle fight fans. Members can participate in live and shadow fight predictions, join leagues, and compete for cash prizes while showcasing their activity on public profiles."
        }
      },
      {
        "@type": "Question",
        "name": "How do live fight predictions work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Members predict the outcomes of live fights, such as punch counts, round winners, and methods of victory, before the fight begins. Predictions are scored in real-time by administrators using a live scoring tool, often accompanied by a video stream and chat."
        }
      },
      {
        "@type": "Question",
        "name": "Can I play for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! FantasyMMAdness offers free-to-play fights for members to test their prediction skills. However, paid fights require tokens as a buy-in. Tokens can be purchased or earned through referrals and site promotions."
        }
      },
      {
        "@type": "Question",
        "name": "What rewards can I earn on FantasyMMAdness?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Members can win cash prizes (POTS), tokens, and bragging rights by performing well in predictions. Affiliates can also earn profits from hosting successful shadow fights. Members can share their achievements via public profiles."
        }
      },
      {
        "@type": "Question",
        "name": "What are tokens, and how do they work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tokens are the platform's currency used to participate in paid fights. Members can purchase tokens or earn them by inviting friends to join FantasyMMAdness. Tokens can also be refunded if a fight is canceled due to unmet buy-in requirements."
        }
      }
    ]
  }

  return (
    <>
      <Head>
        <title>FAQs – Fantasy Boxing Game & League | Fantasy-MMadness</title>
        <meta 
          name="description" 
          content="Got questions about Fantasy-MMadness? Explore our FAQ section to learn more about fantasy boxing leagues, games, tokens, rewards, and sign-up benefits." 
        />
        <meta 
          name="keywords" 
          content="fantasy boxing, fantasy boxing game, fantasy boxing league, fantasy sports FAQ, how to play fantasy combat sports, Fantasy-MMadness questions" 
        />
        <meta property="og:title" content="FAQs – Fantasy Boxing League & Game Info" />
        <meta property="og:description" content="Find answers to your questions about fantasy boxing, token rewards, and how to play Fantasy-MMadness." />
        <meta property="og:image" content="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />
        <meta property="og:url" content="https://fantasymmadness.com/faqs" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FAQs – Fantasy Boxing League & Game Info" />
        <meta name="twitter:description" content="Answers to common questions about fantasy boxing gameplay, leagues, tokens, and rewards." />
        <meta name="twitter:image" content="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />

        <link rel="icon" href="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />

        {/* JSON-LD FAQ Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <FrequentAskedQuestions faqs={faqs} />
    </>
  )
}

export const getServerSideProps = async () => {
  try {
    const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/faqs")
    if (!response.ok) {
      throw new Error("Failed to fetch FAQs")
    }
    const data = await response.json()

    return {
      props: { faqs: data.data || [] },
    }
  } catch (error) {
    console.error("Error fetching FAQs:", error)
    return { props: { faqs: [] } }
  }
}

export default FAQsPage
