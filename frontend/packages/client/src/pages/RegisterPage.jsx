import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '@zolid/shared/components';
import apiClient from '@zolid/shared/utils/apiClient';
import { EMAILS } from '@zolid/shared/constants';
import logo from '../assets/logos/logo.png';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    homeGpsAddress: '',
    homeLat: '',
    homeLon: '',
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

    if (!formData.phone || !formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData = {
        phone_primary: formData.phone,
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
      };

      // Add optional fields if provided
      if (formData.homeGpsAddress) registrationData.home_gps_address = formData.homeGpsAddress;
      if (formData.homeLat && formData.homeLon) {
        registrationData.home_lat = parseFloat(formData.homeLat);
        registrationData.home_lon = parseFloat(formData.homeLon);
      }

      await apiClient.post('/identity/client/register', registrationData);

      // Auto-login after successful registration
      const loginResponse = await apiClient.post('/identity/client/login', {
        phone_primary: formData.phone,
        password: formData.password,
      });

      localStorage.setItem('authToken', loginResponse.data.token);
      localStorage.setItem('userId', loginResponse.data.client_id);
      localStorage.setItem('userRole', 'client');

      navigate('/dashboard');
    } catch (err) {
      // Backend returns error in 'message' field, not 'error'
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
              Create Account
            </h1>
            <p className="text-navy-600 mb-6">
              Register to start hiring verified artisans
            </p>

            <form onSubmit={handleSubmit}>
              <Input
                label="Full Name"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                placeholder="0203548414 or 0552537904"
                value={formData.phone}
                onChange={handleChange}
                required
                helperText="Enter your phone number (e.g., 0203548414 or 0552537904)"
                disabled={isSubmitting}
              />

              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
                helperText="Must be at least 8 characters long"
                disabled={isSubmitting}
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <Input
                label="GPS Address (Optional)"
                type="text"
                name="homeGpsAddress"
                placeholder="GA-XXX-XXX"
                value={formData.homeGpsAddress}
                onChange={handleChange}
                helperText="Your Ghana Post GPS address"
                disabled={isSubmitting}
              />

              {error && (
                <div className="mb-4 p-3 bg-coral-50 border border-coral-200 rounded-lg">
                  <p className="text-sm text-coral-700">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-navy-600">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Sign In
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

export default RegisterPage;
