import React, { useState } from 'react';
import AuthLayout from '../Auth/AuthLayout';
import PasswordField from '../Auth/PasswordField';
import { flashToast } from '../Toast/Toast';

const Login = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  let login_url = window.location.origin + "/djangoapp/login";

  const login = async (e) => {
    e.preventDefault();
    if (userName.trim() === "" || password === "") {
      setError("Enter your username and password to log in.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(login_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "userName": userName, "password": password }),
      });
      const json = await res.json();
      if (json.status != null && json.status === "Authenticated") {
        sessionStorage.setItem('username', json.userName);
        flashToast(`Welcome back, ${json.userName}.`);
        window.location.href = "/dealers";
      } else {
        setError("Those details did not match an account. Check your username and password and try again.");
        setBusy(false);
      }
    } catch (err) {
      setError("The server did not respond. It may still be waking up — wait a few seconds and try again.");
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      visualTitle="Welcome back."
      visualText="Log in to pick up where you left off: dealer scores, comparisons and your reviews are waiting."
      heading="Log in"
      subheading="Use the username and password you registered with."
    >
      {error && <div className="auth_error" role="alert">{error}</div>}
      <form onSubmit={login} noValidate>
        <div className="auth_field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            autoComplete="username"
            placeholder="e.g. ireneus"
          />
        </div>
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Your password"
        />
        <button className="auth_submit" type="submit" disabled={busy}>
          {busy ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="auth_alt">
        New to Auto Review Hub? <a href="/register">Create an account</a>
      </p>
      <a className="auth_back" href="/">Back to the home page</a>
    </AuthLayout>
  );
};

export default Login;
