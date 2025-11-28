import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import './Auth.css';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📋 Cloud Clipboard</h1>
          <p>Access your clips from any device</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? '🔐 Login' : '✨ Sign Up')}
          </button>

          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="btn-toggle"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </form>

        <div className="auth-features">
          <div className="feature">
            <span className="feature-icon">☁️</span>
            <span>Cloud Sync</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📱</span>
            <span>Multi-Device</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
