import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

const InvitePage = () => {
  const router = useRouter()
  const { referrerId } = router.query

  return (
    <>
      <Head>
        <title>Invite & Earn | Get 20 Free Tokens – Fantasy-MMadness</title>
        <meta 
          name="description" 
          content="Invite your friends to Fantasy-MMadness and earn 20 free tokens! Join the fantasy boxing revolution and compete for prizes. Sign up today with your referral!" 
        />
        <meta 
          name="keywords" 
          content="fantasy boxing, fantasy boxing game, fantasy boxing league, invite and earn tokens, referral program fantasy sports" 
        />
        <meta property="og:title" content="Join Fantasy-MMadness – Get 20 Free Tokens!" />
        <meta property="og:description" content="Sign up now using a referral link and earn 20 free tokens to play fantasy boxing and combat sports games!" />
        <meta property="og:image" content="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />
        <meta property="og:url" content="https://fantasymmadness.com/invite" />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Join Fantasy-MMadness – Get 20 Free Tokens!" />
        <meta name="twitter:description" content="Earn tokens by joining through referrals and play our fantasy boxing league for free!" />
        <meta name="twitter:image" content="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />

        <link rel="icon" href="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />
      </Head>

      <div className='invite-container'>
        <h1>Earn 20 free tokens to play fantasy sports by Signing up</h1>
        <Link href={`/CreateAccount?referrer=${referrerId}`} className='signUpBtnInvite'>
          Sign up now
        </Link>
      </div>
    </>
  )
}

export default InvitePage
