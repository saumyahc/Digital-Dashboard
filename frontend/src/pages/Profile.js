import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';

const Profile = () => {
  const { user, loading, error, updateProfile, updatePassword } = useAuth();
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Form submission states
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  
  // Form errors
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Load user data into form when available
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Handle profile form input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if any
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle password form input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if any
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!profileForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    try {
      setProfileSubmitting(true);
      await updateProfile(profileForm);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      // Error is handled by the AuthContext and displayed via the error prop
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      setPasswordSubmitting(true);
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      // Reset password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password updated successfully');
    } catch (err) {
      console.error('Error updating password:', err);
      // Error is handled by the AuthContext and displayed via the error prop
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile Settings</h1>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      
      <div className="space-y-6">
        {/* Profile Information */}
        <Card title="Profile Information">
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
            <FormInput
              label="Name"
              type="text"
              name="name"
              value={profileForm.name}
              onChange={handleProfileChange}
              placeholder="Your name"
              error={profileErrors.name}
            />
            
            <FormInput
              label="Email Address"
              type="email"
              name="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              placeholder="Your email"
              error={profileErrors.email}
            />
            
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={profileSubmitting}
              >
                {profileSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
        
        {/* Change Password */}
        <Card title="Change Password">
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            <FormInput
              label="Current Password"
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Enter your current password"
              error={passwordErrors.currentPassword}
            />
            
            <FormInput
              label="New Password"
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="Enter your new password"
              error={passwordErrors.newPassword}
            />
            
            <FormInput
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirm your new password"
              error={passwordErrors.confirmPassword}
            />
            
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={passwordSubmitting}
              >
                {passwordSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;