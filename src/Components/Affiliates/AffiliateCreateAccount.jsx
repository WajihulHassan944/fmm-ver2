import React, { useState } from 'react';
import AffiliateThankyou from './AffiliateThankyou';  // Import Thankyou component
import ReCAPTCHA from "react-google-recaptcha";  // Import reCAPTCHA

import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAffiliate } from '@/Redux/affiliateAuthSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AffiliateCreateAccount = () => {
    const router = useRouter();  

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        playerName: '',
        email: '',
        phone: '',
        zipCode: '',
        isNotificationsEnabled: false,
        isSubscribed: false,
        isUSCitizen: false,
        isAgreed: false,
        password: '',
        affiliateImage: null,
    });
    const { isAuthenticatedAffiliate, loading,  userAffiliate } = useSelector((state) => state.affiliateAuth);
      const dispatch = useDispatch();
  
    const [isRegistered, setIsRegistered] = useState(false);
    const [buttonText, setButtonText] = useState('Register');  // State for button text
    const [recaptchaToken, setRecaptchaToken] = useState('');  // State for reCAPTCHA token

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (name === 'affiliateImage' && files.length > 0) {
            // If the user uploads an image, convert it to a URL and update the state
            const file = files[0];
            const imageUrl = URL.createObjectURL(file);

            setFormData((prevData) => ({
                ...prevData,
                affiliateImage: imageUrl, // Update the image preview
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };

    const handleRecaptchaChange = (token) => {
        setRecaptchaToken(token);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!recaptchaToken) {
            alert("Please verify that you are not a robot.");
            return;
        }
        if (!formData.isAgreed) {
            alert("Please accept our terms and service to continue.");
            return;
        }


        // Change button text to "Saving! Please wait"
        setButtonText('Saving! Please wait');

        try {
            const formDataToSend = new FormData();

            // Append other form data
            for (const key in formData) {
                if (key !== 'affiliateImage') {
                    formDataToSend.append(key, formData[key]);
                }
            }

            // Append the image file if it exists
            if (e.target.affiliateImage.files[0]) {
                formDataToSend.append('image', e.target.affiliateImage.files[0]);
            }

            const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/registerAffiliate', {
                method: 'POST',
                body: formDataToSend,
            });

           const data = await response.text();

if (response.ok) {
    setIsRegistered(true);
    toast.success('Affiliate registration successful!'); // ✅ success toast
} else {
    // ✅ Show error toast for duplicate or other issues
    if (data.includes('Email already registered')) {
        toast.error('This email is already registered. Please use another one.');
    } else {
        toast.error(data || 'There was an error registering. Please try again.');
    }
}
        } catch (error) {
            console.error('There was an error registering!', error);
        } finally {
            // Revert button text after registration
            setButtonText('Register');
        }
    };

    const clearPlayerName = () => {
        setFormData((prevData) => ({
            ...prevData,
            playerName: ''
        }));
    };

    if (isRegistered) {
        return <AffiliateThankyou />;  // Pass the dynamic response as prop to Thankyou
    }



  const handleGoogleSuccess = async (response) => {
    const { credential } = response;
  
    const googleLoginPromise = new Promise(async (resolve, reject) => {
      try {
        // Send the Google token to your backend API for verification and user handling
        const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/affiliate-google-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: credential, // Send the token here
          }),
        });
  
        if (!res.ok) {
          throw new Error('Google login failed'); // Throw an error if response is not ok
        }
  
        const data = await res.json();
        console.log('Google login response:', data);
  
        if (data.token) {
          localStorage.setItem('affiliateAuthToken', data.token);
          dispatch(fetchAffiliate(data.token));
  
          if (!data.affiliate.verified) {
            // If user is not verified, show a toast and reject the promise
            toast.warning('Your account is pending admin approval. You are not authenticated to access the dashboard.');
            reject(new Error('Account pending admin approval. Please be patient and wait !'));
         setIsRegistered(true);
          } else {
            resolve(); // Resolve the promise if verified
          }
        } else {
          reject(new Error('No token returned from Google login.')); // Reject if no token
        }
      } catch (error) {
        console.error('Error during Google login:', error);
        reject(new Error('Error during Google login.')); // Reject on error
      }
    });
  
    // Use toast.promise to handle pending, success, and error states
    toast.promise(googleLoginPromise, {
      pending: 'Signing up with Google...',
      success: 'Google Sign up successful! 👌',
      error: {
        render({ data }) {
          return data.message || 'Google login failed';
        },
      },
    });
  };
  

  const handleGoogleError = () => {
    console.error('Google Login Failed');
  };



  // Check if user is authenticated and has a valid plan
  if (userAffiliate) {
    if (!userAffiliate.verified) {
      console.log("Please wait for your affiliate status approval from admin");
    } else if (isAuthenticatedAffiliate) {
       router.push("/AffiliateDashboard"); // Redirect to UserDashboard
    }
  }


    return (
        <div className='createAccount affiliateCreateAccount'>
            <p className='affiliateLinkppp'  >Users Only!</p>
        
       <Link href="/CreateAccount"> <p className='affiliateLink'>Are you a User? Click here</p></Link>
       
            <div className='registerCard'>
                <h1>Affiliate Registration</h1>
                      <div className="google-login-wrapper">
               <GoogleLogin 
                 onSuccess={handleGoogleSuccess} 
                 onError={handleGoogleError}
               />
             </div>
              
                <form onSubmit={handleSubmit}>
                    {/* Form Fields */}
                    <div className='input-wrap-one'>
                        <div className='input-group'>
                            <label>First Name <span>*</span></label>
                            <input type='text' name="firstName" value={formData.firstName} onChange={handleChange} required />
                        </div>
                        <div className='input-group'>
                            <label>Last Name <span>*</span></label>
                            <input type='text' name="lastName" value={formData.lastName} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className='input-wrap-two'>
                        <div className='input-group'>
                            <label>Desired Affiliate Name? <span>*</span></label>
                            <input type='text' name="playerName" value={formData.playerName} onChange={handleChange} required />
                        </div>
                        <i className="fa fa-refresh" aria-hidden="true" onClick={clearPlayerName}></i>
                    </div>

                    <div className='input-wrap-one'>
                        <div className='input-group'>
                            <label>Your Email <span>*</span></label>
                            <input type='email' name="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className='input-group'>
                            <label>Your Phone<span className='toRemove'> (Mobile)</span> <span>*</span></label>
                            <input type='text' name="phone" value={formData.phone} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className='input-wrap-two'>
                        <div className='input-group' style={{flexBasis:'100%'}}>
                            <label>How did you hear about us? <span>*</span></label>
                            <input type='text' name="hearing" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className='input-wrap-one'>
                        <div className='input-group'>
                            <label>Zip Code <span>*</span></label>
                            <input type='text' name="zipCode" value={formData.zipCode} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className='input-wrap-one'>
                        <div className='input-group'>
                            <label>Password <span>*</span></label>
                            <input type='password' name="password" value={formData.password} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className='input-wrap-one specialDivInputs'>
                        <div className='input-group special-input-group'>
                            <img src={formData.affiliateImage || "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519110/home/mzfjvo1lq3q8tv7fwjjz.png"} alt="Affiliate Logo" style={{background:'#fff', border:'2px solid blue'}} />
                        </div>
                    </div>
                    <div className='input-wrap-one'>
                        <div className='input-group'>
                            <label>Profile Image <span>*</span></label>
                            <input type='file' name='affiliateImage' onChange={handleChange} />
                        </div>
                    </div>

                    <div className='termsConditions'>
                        <h2>Terms and conditions</h2>
                        <p>Terms and Conditions of Fantasy Mmadness
These Terms govern:

• the use of this Application, and,

• any other related Agreement or legal relationship with the Owner in a legally binding way. Capitalized words are defined in the relevant dedicated section of this document.

The User must read this document carefully.

This Application is provided by:

Fantasy Mmadness LLC -

Owner contact email: fantasymmadness2@gmail.com

Information about this Application
Fantasy Mmadness League (FMMA) is a digital service and a platform where combat sports fans can test their boxing/MMA knowledge and compete against each other.

What the User should know at a glance
• The Service/this Application is only intended for Consumers.

• Usage of this Application and the Service is age restricted: to access and use this Application and its Service the User must be an adult under applicable law.

TERMS OF USE
Unless otherwise specified, the terms of use detailed in this section apply generally when using this Application.

Single or additional conditions of use or access may apply in specific scenarios and in such cases are additionally indicated within this document.

By using this Application, Users confirm to meet the following requirements:

• Users must qualify as Consumers;

• Users must be recognized as adult by applicable law;

Account registration
To use the Service Users must register or create a User account, providing all required data or information in a complete and truthful manner.

Failure to do so will cause unavailability of the Service.

Users are responsible for keeping their login credentials confidential and safe. For this reason, Users are also required to choose passwords that meet the highest standards of strength permitted by this Application.

By registering, Users agree to be fully responsible for all activities that occur under their username and password.

Users are required to immediately and unambiguously inform the Owner via the contact details indicated in this document, if they think their personal information, including but not limited to User accounts, access credentials or personal data, have been violated, unduly disclosed or stolen.

Account termination
Users can terminate their account and stop using the Service at any time by doing the following:

• By directly contacting the Owner at the contact details provided in this document.

Account suspension and deletion
The Owner reserves the right, at its sole discretion, to suspend or delete at any time and without notice, User accounts that it deems inappropriate, offensive or in violation of these Terms.

The suspension or deletion of User accounts shall not entitle Users to any claims for compensation, damages or reimbursement.

The suspension or deletion of accounts due to causes attributable to the User does not exempt the User from paying any applicable fees or prices.

Content on this Application
Unless where otherwise specified or clearly recognizable, all content available on this Application is owned or provided by the Owner or its licensors.

The Owner undertakes its utmost effort to ensure that the content provided on this Application infringes no applicable legal provisions or third-party rights. However, it may not always be possible to achieve such a result.

In such cases, without prejudice to any legal prerogatives of Users to enforce their rights, Users are kindly asked to preferably report related complaints using the contact details provided in this document.

Rights regarding content on this Application - All rights reserved
The Owner holds and reserves all intellectual property rights for any such content.

Users may not, therefore, use such content in any way that is not necessary or implicit in the proper use of the Service.

In particular, but without limitation, Users may not copy, download, share (beyond the limits set forth below), modify, translate, transform, publish, transmit, sell, sublicense, edit, transfer/assign to third parties or create derivative works from the content available on this Application, nor allow any third party to do so through the User or their device, even without the User's knowledge.

Where explicitly stated on this Application, the User may download, copy and/or share some content available through this Application for its sole personal and non-commercial use and provided that the copyright attributions and all the other attributions requested by the Owner are correctly implemented.

Any applicable statutory limitation or exception to copyright shall stay unaffected.

Content provided by Users
The Owner allows Users to upload, share or provide their own content to this Application.

By providing content to this Application, Users confirm that they are legally allowed to do so and that they are not infringing any statutory provisions and/or third-party rights.

Rights regarding content provided by Users
Users acknowledge and accept that by providing their own content on this Application they grant the Owner a non-exclusive, fully paid-up and royalty-free license to process such content solely for the operation and maintenance of this Application as contractually required.

To the extent permitted by applicable law, Users waive any moral rights in connection with content they provide to this Application.

Users are solely liable for any content they upload, post, share, or provide through this Application.

Users acknowledge and accept that the Owner filters or moderates such content after it has been made available.

Therefore, the Owner reserves the right to refuse, remove, delete, or block such content at its own discretion and to deny access to this Application to the uploading User without prior notice, if it considers such content to infringe these Terms, any applicable legal provision or third-party right, or to otherwise represent a risk for Users, third parties, the Owner and/or the availability of the Service.

The removal, deletion or blocking of content shall not entitle Users that have provided such content or that are liable for it, to any claims for compensation, damages or reimbursement.

Users agree to hold the Owner harmless from and against any claim asserted and/or damage suffered due to content they provided to or provided through this Application.

Access to provided content
Content that Users provide to this Application is made available according to the criteria outlined within this section.

Publicly available content
Content meant for public availability shall be automatically made public on this Application upon upload or, at the sole discretion of the Owner, at a later stage.

Any personal data, identifier or any other information that Users upload in connection with such content (such as a User-ID, avatar or nickname etc.) shall also appear in connection with the published content.

Users may (and are encouraged to) check on this Application to find details of who can access the content they provide.

Access to external resources
Through this Application Users may have access to external resources provided by third parties. Users acknowledge and accept that the Owner has no control over such resources and is therefore not responsible for their content and availability.

Conditions applicable to any resources provided by third parties, including those applicable to any possible grant of rights in content, result from each such third parties’ terms and conditions or, in the absence of those, applicable statutory law.

Acceptable use
This Application and the Service may only be used within the scope of what they are provided for, under these Terms and applicable law.

Users are solely responsible for making sure that their use of this Application and/or the Service violates no applicable law, regulations or third-party rights.

Therefore, the Owner reserves the right to take any appropriate measure to protect its legitimate interests including by denying Users access to this Application or the Service, terminating contracts, reporting any misconduct performed through this Application or the Service to the competent authorities – such as judicial or administrative authorities - whenever Users engage or are suspected to engage in any of the following activities:

• violate laws, regulations and/or these Terms;

• infringe any third-party rights;

• considerably impair the Owner’s legitimate interests;

• offend the Owner or any third party.

Software license
Any intellectual or industrial property rights, and any other exclusive rights on software or technical applications embedded in or related to this Application are held by the Owner and/or its licensors.

Subject to Users’ compliance with and notwithstanding any divergent provision of these Terms, the Owner merely grants Users a revocable, non-exclusive, non-sublicensable and non-transferable license to use the software and/or any other technical means embedded in the Service within the scope and for the purposes of this Application and the Service offered.

This license does not grant Users any rights to access, usage or disclosure of the original source code. All techniques, algorithms, and procedures contained in the software and any documentation thereto related is the Owner’s or its licensors’ sole property.

All rights and license grants to Users shall immediately terminate upon any termination or expiration of the Agreement.
Liability and indemnification
Unless otherwise explicitly stated or agreed with Users, the Owner’s liability shall be limited as follows:
The Owner shall be liable only for damages directly attributable to the Service's malfunctioning up to an amount equal to the value of the fees paid by the User or up to the corresponding market value of the Service for the relevant period of usage.
The Owner shall not be liable for any damages, losses, or costs due to User’s non-fulfillment of the Agreement or in the case of events attributable to third parties.
Users agree to indemnify and hold the Owner and its subsidiaries, affiliates, officers, directors, agents, co-branders, partners, and employees harmless from and against any claim or demand – including but not limited to legal fees and costs – made by any third party due to or arising out of the User’s culpable or negligent conduct, violation of these Terms, violation of third-party rights, or violation of statutory provisions by the User or its affiliates, officers, directors, agents, co-branders, partners, and employees to the extent allowed by applicable law.
Common provisions
No Waiver
The Owner’s failure to assert any right or provision under these Terms shall not constitute a waiver of any such right or provision.
Service interruption
To ensure the best possible service level, the Owner reserves the right to interrupt the Service for maintenance, system updates or any other changes, informing the Users appropriately.
Within the limits of law, the Owner may also decide to suspend or terminate the Service altogether.
If the Service is terminated, the Owner will cooperate with Users to enable them to withdraw Personal Data or information in accordance with applicable law.
Additionally, the Service might not be available due to reasons outside the Owner’s reasonable control, such as “force majeure” (eg. labor actions, infrastructural breakdowns, or blackouts etc).
Service reselling
Users may not reproduce, duplicate, copy, sell, resell or exploit any portion of this Application and of its Service without the Owner’s express prior written permission, granted either directly or through a legitimate reselling program.
Privacy policy
To learn more about the use of their Personal Data, Users may refer to the privacy policy of this Application.
Intellectual property rights
Without prejudice to any more specific provision of these Terms, any intellectual property rights, such as copyrights, trademark rights, patent rights, and design rights related to this Application are held by the Owner or its licensors and are subject to the protection granted by applicable laws or international treaties relating to intellectual property.
All trademarks – nominal or figurative – and all other marks, trade names, service marks, wordmarks, illustrations, images, or logos appearing in connection with this Application are, and remain, the exclusive property of the Owner or its licensors and are subject to the protection granted by applicable laws or international treaties related to intellectual property.
Changes to these Terms
The Owner reserves the right to amend or otherwise modify these Terms at any time.
In such cases, the Owner will appropriately inform the User of these changes.
Such changes will only affect the relationship with the User for the future.
The continued use of the Service will signify the User's acceptance of the revised Terms. If Users do not wish to be bound by the changes, they must stop using the Service. Failure to accept the revised Terms may entitle either party to terminate the Agreement.
If required by applicable law, the Owner will specify the date by which the modified Terms will enter into force.
Assignment of contract
The Owner reserves the right to transfer, assign, dispose of by novation, or subcontract any or all rights or obligations under these Terms, taking the User’s legitimate interests into account. Provisions regarding changes of these Terms shall apply accordingly.
Users may not assign or transfer their rights or obligations under these Terms in any way, without the written permission of the Owner.
Contacts
All communications relating to the use of this Application must be sent using the contact information stated in this document.
Severability
Should any provision of these Terms be deemed or become invalid or unenforceable under applicable law, the invalidity or unenforceability of such provision shall not affect the validity of the remaining provisions, which shall remain in full force and effect.
Users from such jurisdictions may access such rights by simply using this Application.
Governing law
These Terms are governed by the law of the place where the Owner is based, as disclosed in the relevant section of this document, without regard to conflict of laws principles.
Venue of jurisdiction
The exclusive competence to decide on any controversy resulting from or connected to these Terms lies with the courts of the place where the Owner is based, as displayed in the relevant section of this document.
Definitions and legal references
This Application (or this Application)
The property that enables the provision of the Service.
Agreement

Any legally binding or contractual relationship between the Owner and the User, governed by these Terms.
Owner (or We)
Indicates the natural person(s) or legal entity that provides this Application and/or the Service to Users.
Service
The service provided by this Application as described in these Terms and on this Application.
User (or You)
Indicates any natural person or legal entity using this Application.
Consumer
Consumer is any User qualifying as such under applicable law.
Latest update: August 29, 2024
iubenda hosts this content and only collects the Personal Data strictly necessary for it to be provided.

</p>
                    </div>

                    <div className="checking" style={{ backgroundColor: "#367cde", color: '#333' }}>
                        <label className="custom-radio-label">
                            <input
                                type="checkbox"
                                name="isNotificationsEnabled"
                                checked={formData.isNotificationsEnabled}
                                onChange={handleChange}
                            />
                            <span className={`custom-radio ${formData.isNotificationsEnabled ? 'checked' : ''}`}></span>
                            I would like to be sent activity notifications via SMS
                        </label>
                    </div>

                    <div className="checking">
                        <label className="custom-radio-label">
                            <input
                                type="checkbox"
                                name="isSubscribed"
                                checked={formData.isSubscribed}
                                onChange={handleChange}
                            />
                            <span className={`custom-radio ${formData.isSubscribed ? 'checked' : ''}`}></span>
                            Subscribe to fmma E-list for updates and promotions
                        </label>
                    </div>

                    <div className="checking" style={{ backgroundColor: '#fff' }}>
                        <label className="custom-radio-label">
                            <input
                                type="checkbox"
                                name="isUSCitizen"
                                checked={formData.isUSCitizen}
                                onChange={handleChange}
                            />
                            <span className={`custom-radio ${formData.isUSCitizen ? 'checked' : ''}`}></span>
                            I am a US citizen and reside in the United States
                        </label>
                    </div>

                    <div className="checking">
                        <label className="custom-radio-label">
                            <input
                                type="checkbox"
                                name="isAgreed"
                                checked={formData.isAgreed}
                                onChange={handleChange}
                            />
                            <span className={`custom-radio ${formData.isAgreed ? 'checked' : ''}`}></span>
                            I have read and agree to the terms and conditions
                        </label>
                    </div>

                    <ReCAPTCHA
                        sitekey="6LeLErwpAAAAAD3s3QWddvNAWULeDdLGUu3_-5lK"
                        onChange={handleRecaptchaChange}
                    />

                    <button type="submit" className='btn-grad' style={{ minWidth: '37%' }}>{buttonText}</button>
                </form>
            </div>
        </div>
    );
}
export default AffiliateCreateAccount;
