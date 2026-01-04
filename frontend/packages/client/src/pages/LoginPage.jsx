import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import { EMAILS } from '@zolid/shared/constants';
import logo from '../assets/logos/logo.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.phone || !formData.password) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    const result = await login(formData.phone, formData.password, 'client');
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-grey-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy-900 text-white px-6 py-6 flex items-center justify-center">
        <img src={logo} alt="ZOLID" className="h-10 w-auto" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <h1 className="font-condensed font-bold text-3xl text-navy-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-navy-600 mb-6">
              Sign in to your client account
            </p>

            <form onSubmit={handleSubmit}>
              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                placeholder="0203548414 or 0552537904"
                value={formData.phone}
                onChange={handleChange}
                required
                helperText="Enter your phone number (e.g., 0203548414 or 0552537904)"
                error={error}
                disabled={isSubmitting || loading}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isSubmitting || loading}
              />

              {(error || authError) && (
                <div className="mb-4 p-3 bg-coral-50 border border-coral-200 rounded-lg">
                  <p className="text-sm text-coral-700">
                    {error || authError}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-navy-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Sign Up
                </Link>
              </p>
            </div>
          </Card>

          {/* Contact Link */}
          <div className="mt-6 text-center">
            <a
              href={`mailto:${EMAILS.SUPPORT}`}
              className="text-sm text-navy-500 hover:text-navy-700"
            >
              Need Help? Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
