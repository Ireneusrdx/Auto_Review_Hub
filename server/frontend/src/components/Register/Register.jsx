import React, { useState } from "react";
import AuthLayout from '../Auth/AuthLayout';
import PasswordField from '../Auth/PasswordField';
import { flashToast } from '../Toast/Toast';

const Register = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const register = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !firstName.trim() || !lastName.trim()
        || !email.trim() || !password) {
      setError("Fill in every field to create your account.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("That email address does not look complete. Check it and try again.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");

    let register_url = window.location.origin + "/djangoapp/register";
    try {
      const res = await fetch(register_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "userName": userName,
          "password": password,
          "firstName": firstName,
          "lastName": lastName,
          "email": email
        }),
      });
      const json = await res.json();
      if (json.status) {
        sessionStorage.setItem('username', json.userName);
        // PostReview builds the reviewer name from these two keys.
        sessionStorage.setItem('firstname', firstName);
        sessionStorage.setItem('lastname', lastName);
        flashToast(`Account created — welcome, ${json.userName}.`);
        window.location.href = window.location.origin + "/dealers";
      } else if (json.error === "Already Registered") {
        setError("That username is already registered. Pick a different username, or log in if it is yours.");
        setBusy(false);
      } else {
        setError("Registration did not go through. Please try again.");
        setBusy(false);
      }
    } catch (err) {
      setError("The server did not respond. It may still be waking up — wait a few seconds and try again.");
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      visualTitle="Buy your next car with your eyes open."
      visualText="Create a free account to unlock the full dealership directory, reputation scores and comparisons."
      heading="Create your account"
      subheading="It takes a minute, and it is free. Your name is how your reviews will be credited."
    >
      {error && <div className="auth_error" role="alert">{error}</div>}
      <form onSubmit={register} noValidate>
        <div className="auth_field_row">
          <div className="auth_field">
            <label htmlFor="first_name">First name</label>
            <input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              placeholder="e.g. Ireneus"
            />
          </div>
          <div className="auth_field">
            <label htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              placeholder="e.g. Rodrigues"
            />
          </div>
        </div>
        <div className="auth_field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            autoComplete="username"
            placeholder="Pick a username"
          />
        </div>
        <div className="auth_field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Choose a password"
        />
        <PasswordField
          id="confirm_password"
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          placeholder="Type the password again"
        />
        <button className="auth_submit" type="submit" disabled={busy}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="auth_alt">
        Already have an account? <a href="/login">Log in</a>
      </p>
      <a className="auth_back" href="/">Back to the home page</a>
    </AuthLayout>
  );
};

export default Register;
