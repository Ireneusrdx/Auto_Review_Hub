import React from 'react';
import "../assets/style.css";
import "../assets/bootstrap.min.css";
import { flashToast } from '../Toast/Toast';

const Header = () => {
    const logout = async (e) => {
    e.preventDefault();
    let logout_url = window.location.origin+"/djangoapp/logout";
    const res = await fetch(logout_url, {
      method: "GET",
    });
  
    const json = await res.json();
    if (json) {
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('firstname');
      sessionStorage.removeItem('lastname');
      flashToast('You have been logged out.');
      window.location.href = window.location.origin;
    }
    else {
      alert("The user could not be logged out.")
    }
  };
    
//The default home page items are the login details panel
let home_page_items =  <div></div>

//Gets the username in the current session
let curr_user = sessionStorage.getItem('username')

//If the user is logged in, show the username and logout option on home page
if ( curr_user !== null &&  curr_user !== "") {
    home_page_items = <div className="input_panel">
      <text className='username'>{sessionStorage.getItem("username")}</text>
    <a className="nav_item" href="/myreviews" style={{marginLeft: "10px"}}>My Reviews</a>
    <a className="nav_item" href="/djangoapp/logout" onClick={logout} style={{marginLeft: "10px"}}>Logout</a>
  </div>
} else {
    // Logged out: the nav bar must offer login and signup (Module 1).
    // Previously this branch rendered an empty panel, so there was no
    // way to reach the login or register pages from the home page.
    home_page_items = <div className="input_panel">
    <a className="nav_item" href="/login">Login</a>
    <a className="nav_item" href="/register" style={{marginLeft: "10px"}}>Register</a>
  </div>
}
    return (
        <div>
          <nav class="navbar navbar-expand-lg navbar-light" style={{backgroundColor:"darkturquoise",height:"1in"}}>
            <div class="container-fluid">
              <h2 style={{paddingRight: "5%"}}>Auto Review Hub</h2>
              <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="navbarText">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                  <li class="nav-item">
                    <a class="nav-link active" style={{fontSize: "larger"}} aria-current="page" href={curr_user ? "/dealers" : "/"}>Home</a>
                  </li>
                  {curr_user ? (
                  <li class="nav-item">
                    <a class="nav-link" style={{fontSize: "larger"}} href="/cars">Cars</a>
                  </li>
                  ) : <></>}
                  <li class="nav-item">
                    <a class="nav-link" style={{fontSize: "larger"}} href="/about">About Us</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" style={{fontSize: "larger"}} href="/contact">Contact Us</a>
                  </li>
                </ul>
                <span class="navbar-text">
                  <div class="loginlink" id="loginlogout">
                  {home_page_items}
                  </div>
                  </span>
              </div>
            </div>
          </nav>
        </div>
    )
}

export default Header
