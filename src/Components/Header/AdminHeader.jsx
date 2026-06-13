import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { logoutAdmin } from '@/Redux/adminAuthSlice';

const AdminHeader = () => {
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { pathname } = useRouter() || {}; // Ensure it never crashes
  const handleLogout = () => {
    dispatch(logoutAdmin());
    router.push('/'); // Redirect to admin login page after logout
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div>
    
      <div className='menuIconFontAdmin' onClick={toggleMenu}>
        <i className={menuOpen ? "fa fa-times" : "fa fa-bars"}></i>
      </div>
      
      <div className='adminLogo'>
        <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp" alt="Logo" style={{width:'70px'}} />
      </div>

        <div className={`admin-header ${menuOpen ? 'activeAdmin' : 'activeNotAdmin'}`}>
          <div>
            <center>
              <div className='logoimg'>
                <Link href="/administration">
                  <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp" alt="Logo" style={{width:'70px'}} />
                </Link>
              </div>
            </center>
            <div className='anchorLinksWrapperAdmin'>
              <h1 className='matchHeading' style={{fontSize:'21px', marginTop:'23px'}} >Matches</h1>
              <Link href="/administration/upcomingFights"    className={`anchorlinksAdmin ${pathname === "/administration/upcomingFights" ? "activeLinkAdmin" : ""}`}>Submit/View Scores</Link>
              <Link href="/administration/AddNewMatch" className={`anchorlinksAdmin ${pathname === "/administration/AddNewMatch" ? "activeLinkAdmin" : ""}`}>Create a Match</Link>
              <Link href="/administration/PreviousMatches" className={`anchorlinksAdmin ${pathname === "/administration/PreviousMatches" ? "activeLinkAdmin" : ""}`}>All / prev Matches</Link>
              <Link href="/administration/DeleteUpdateMatches" className={`anchorlinksAdmin ${pathname === "/administration/DeleteUpdateMatches" ? "activeLinkAdmin" : ""}`}>Delete/Update</Link>
              <Link href="/administration/Calendar" className={`anchorlinksAdmin ${pathname === "/administration/Calendar" ? "activeLinkAdmin" : ""}`}>Calandar of matches</Link>
              <Link href="/administration/ShadowFightsLibrary" className={`anchorlinksAdmin ${pathname === "/administration/ShadowFightsLibrary" ? "activeLinkAdmin" : ""}`}>Shadow Fights Library</Link>
              <Link href="/administration/YoutubeArchive" className={`anchorlinksAdmin ${pathname === "/administration/YoutubeArchive" ? "activeLinkAdmin" : ""}`}>Youtube Archive</Link>
              <Link href="/administration/Community" className={`anchorlinksAdmin ${pathname === "/administration/Community" ? "activeLinkAdmin" : ""}`}>Community Forum</Link>
              <Link href="/administration/chatroom" className={`anchorlinksAdmin ${pathname === "/administration/chatroom" ? "activeLinkAdmin" : ""}`}>Chatroom</Link>
              <Link href="/administration/faqs" className={`anchorlinksAdmin ${pathname === "/administration/faqs" ? "activeLinkAdmin" : ""}`}>Faqs</Link>
              <Link href="/administration/news" className={`anchorlinksAdmin ${pathname === "/administration/news" ? "activeLinkAdmin" : ""}`}>News</Link>
              <Link href="/administration/sponsors" className={`anchorlinksAdmin ${pathname === "/administration/sponsors" ? "activeLinkAdmin" : ""}`}>Sponsors</Link>
             
              <h1 className='matchHeading' style={{marginTop:'13px', fontSize:'21px'}}>Users</h1>
              <Link href="/administration/RegisteredUsers" className={`anchorlinksAdmin ${pathname === "/administration/RegisteredUsers" ? "activeLinkAdmin" : ""}`}>Registered Users</Link>
             {/* <Link href="/administration/SubscribedUsers" className={`anchorlinksAdmin ${pathname === "/administration/upcomingFights" ? "activeLinkAdmin" : ""}`}>Subscribed Users</Link>
             */} <Link href="/administration/AffiliateUsers" className={`anchorlinksAdmin ${pathname === "/administration/AffiliateUsers" ? "activeLinkAdmin" : ""}`}>Affiliate Users</Link>
              <Link href="/administration/Email" className={`anchorlinksAdmin ${pathname === "/administration/Email" ? "activeLinkAdmin" : ""}`}>Email Template</Link>




              <h1 className='matchHeading' style={{marginTop:'13px', fontSize:'21px'}}>Blogs</h1>
              <Link href="/administration/blogs" className={`anchorlinksAdmin ${pathname === "/administration/blogs" || pathname?.startsWith('/administration/blogs/blog-details-admin') ? "activeLinkAdmin" : ""}`}>All Blogs</Link>
              <Link href="/administration/blogs/add-new-blog" className={`anchorlinksAdmin ${pathname === "/administration/blogs/add-new-blog" ? "activeLinkAdmin" : ""}`}>Add a blog</Link>
              <Link href="/administration/BlogsAiBot" className={`anchorlinksAdmin ${pathname === "/administration/BlogsAiBot" ? "activeLinkAdmin" : ""}`}>Blog AI Bot</Link>
              <Link href="/administration/SocialAiBot" className={`anchorlinksAdmin ${pathname === "/administration/SocialAiBot" ? "activeLinkAdmin" : ""}`}>Social AI Bot</Link>
             <Link href="/administration/MakePost" className={`anchorlinksAdmin ${pathname === "/administration/MakePost" ? "activeLinkAdmin" : ""}`}>Make AI Post</Link>
          


            </div>
          </div>

          <div className='sideLinkswrapAdmin'>
            <Link href="#" className="sideLinksAdmin" onClick={handleLogout}>
              <i className="fa fa-sign-out" aria-hidden="true"></i> Logout
            </Link>
          </div>
        </div>
    
    </div>
  );
};

export default AdminHeader;
