import React from 'react';

function Sign_in() {
  return (
    <div>
      <div className="modal-content">
        <h2>Create your SKILLFORGE account</h2>
        <form id="signupForm">
          <div className="form-group">
            <label htmlFor="signupName">Full Name</label>
            <input type="text" id="signupName" required />
          </div>
          <div className="form-group">
            <label htmlFor="signupEmail">Email</label>
            <input type="email" id="signupEmail" required />
          </div>
          <div className="form-group">
            <label htmlFor="signupPassword">Password</label>
            <input type="password" id="signupPassword" required />
          </div>
          <button type="submit" className="primary-btn">Create Account</button>
        </form>
        {/* <button className="close-btn" onClick={() => toggleModal('signupModal')}>Close</button> */}
        <a className="close-btn" href="/">close</a>
      </div>
    </div>
  );
}

export default Sign_in;
