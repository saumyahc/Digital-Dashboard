// Quick Authentication Fix Script
// Run this in your browser console to fix authentication issues

console.log('🔐 Authentication Fix Script');

// Function to clear all authentication data
function clearAuth() {
    console.log('Clearing authentication data...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ Authentication data cleared');
}

// Function to test login
async function testLogin() {
    console.log('Testing login...');
    
    try {
        const response = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Login successful!');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.data));
            console.log('Token saved to localStorage');
            return true;
        } else {
            console.log('❌ Login failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
        return false;
    }
}

// Function to test API access
async function testAPI() {
    console.log('Testing API access...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token found');
        return false;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ API access successful!');
            return true;
        } else {
            console.log('❌ API access failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
        return false;
    }
}

// Main fix function
async function fixAuth() {
    console.log('🚀 Starting authentication fix...');
    
    // Step 1: Clear existing auth
    clearAuth();
    
    // Step 2: Test login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
        console.log('❌ Login failed. Please check your credentials or backend server.');
        return;
    }
    
    // Step 3: Test API access
    const apiSuccess = await testAPI();
    if (!apiSuccess) {
        console.log('❌ API access failed. Please check your backend server.');
        return;
    }
    
    console.log('✅ Authentication fix completed successfully!');
    console.log('You can now refresh the page and try again.');
}

// Auto-run the fix
fixAuth();

// Export functions for manual use
window.clearAuth = clearAuth;
window.testLogin = testLogin;
window.testAPI = testAPI;
window.fixAuth = fixAuth;
