import { useState, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../supabase-client';

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        console.error('Error signing up:', signUpError.message);
        setError(signUpError.message);
        return;
      } else {
        setIsSignUp(false);
        console.log('i am here');
        setEmail('');
        setPassword('');
        setSuccessMessage(
          'Email sent for verification. Please check your inbox.'
        );
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000); // Clear message after 5 seconds
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        console.error('Error signing up:', signInError.message);
        setError(signInError.message);
        return;
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem' }}>
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
        />
        {error && (
          <div style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</div>
        )}
        {successMessage && (
          <div style={{ color: 'green', marginBottom: '0.5rem' }}>
            {successMessage}
          </div>
        )}
        <button
          type='submit'
          style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
          setEmail('');
          setPassword('');
        }}
        style={{ padding: '0.5rem 1rem', marginTop: '0.5rem' }}
      >
        {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
      </button>
    </div>
  );
};
