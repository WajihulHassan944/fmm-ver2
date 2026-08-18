import { useRouter } from 'next/router';
import React from 'react';

const CommunityRules = () => {
  const router = useRouter();
  return (
      <div className="thread-list-container-updated">
       <i
          className="fa fa-arrow-circle-left home-arrow-circle home-arrow-circle-forum"
          aria-hidden="true"
          onClick={() =>  router.push(-1)} // Go back to the previous page
          
        ></i>
        <div className='toFlexHeading'>
       <h1 className="forum-heading-updated">Cummunity Forum Rules</h1>
        </div>
          
          



<div className="thread-item-updated" style={{ maxWidth: '1350px', display: 'flex', flexDirection: 'column', cursor:'default' }}>
  <h2 className="thread-title-updated">1. Be Respectful</h2>
  <p className="thread-body-updated">
    Treat all members with respect. Harassment, hate speech, discriminatory remarks, or offensive language will not
    be tolerated. Healthy debates are encouraged, but maintain a respectful tone at all times.
  </p>
  <p className="thread-meta-updated">Violation Alert: Immediate suspension for repeated disrespectful behavior.</p>

  <h2 className="thread-title-updated">2. Stay On Topic</h2>
  <p className="thread-body-updated">
    Ensure that your posts and replies are relevant to the thread's topic. Off-topic comments may be removed to keep
    discussions focused and meaningful.
  </p>
  <p className="thread-meta-updated">Violation Alert: Posts may be deleted without prior notice.</p>

  <h2 className="thread-title-updated">3. No Spamming or Self-Promotion</h2>
  <p className="thread-body-updated">
    Avoid posting repetitive content, irrelevant links, or unsolicited advertisements. Self-promotion is only allowed
    in designated areas and must adhere to the community guidelines.
  </p>
  <p className="thread-meta-updated">Violation Alert: Accounts may be flagged for spam and restricted.</p>

  <h2 className="thread-title-updated">4. Protect Personal Information</h2>
  <p className="thread-body-updated">
    Do not share personal information such as addresses, phone numbers, or other sensitive data. Protect your privacy
    and the privacy of others.
  </p>
  <p className="thread-meta-updated">Violation Alert: Posts with sensitive information will be removed.</p>

  <h2 className="thread-title-updated">5. Report Misconduct</h2>
  <p className="thread-body-updated">
    If you encounter inappropriate behavior, report it to the moderators instead of engaging. Moderators will review
    reports and take appropriate actions.
  </p>
  <p className="thread-meta-updated">Violation Alert: Abuse of the reporting system may result in penalties.</p>

  <h2 className="thread-title-updated">6. Use Proper Language and Format</h2>
  <p className="thread-body-updated">
    Avoid excessive use of all caps, slang, or shorthand that might make your posts difficult to understand. Keep
    language clear and concise to maintain a constructive discussion.
  </p>
  <p className="thread-meta-updated">Violation Alert: Posts may be edited or removed for clarity issues.</p>

  <h2 className="thread-title-updated">7. Follow Posting Guidelines</h2>
  <p className="thread-body-updated">
    Adhere to any specific rules set for individual forums or threads. Always check pinned posts for additional
    guidelines before participating.
  </p>
  <p className="thread-meta-updated">Violation Alert: Repeated disregard for thread rules may result in a ban.</p>

  <h2 className="thread-title-updated">8. Respect Intellectual Property</h2>
  <p className="thread-body-updated">
    Do not post copyrighted material without permission. Give proper credit for shared content and respect the
    intellectual property rights of others.
  </p>
  <p className="thread-meta-updated">Violation Alert: Posts with infringing content will be removed.</p>

  <h2 className="thread-title-updated">9. Engage Constructively</h2>
  <p className="thread-body-updated">
    Contribute to the community by sharing thoughtful insights, asking questions, and helping others. Avoid posting
    inflammatory comments or derailing conversations.
  </p>
  <p className="thread-meta-updated">Violation Alert: Repeated trolling may lead to account suspension.</p>

  <h2 className="thread-title-updated">10. Adhere to Platform Terms</h2>
  <p className="thread-body-updated">
    All activities must comply with the platform’s terms of service. Violations of platform policies may result in
    permanent account suspension.
  </p>
  <p className="thread-meta-updated">Violation Alert: Serious violations may lead to legal action.</p>
</div>








      </div>
    );
  };
  

export default CommunityRules
