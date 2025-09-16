const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API...');
    
    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/users/login', {
      email: 'khushi20051108@gmail.com',
      password: 'password123' // You'll need to provide the correct password
    });
    
    console.log('Login successful:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // Test product creation
    const productData = {
      name: 'Test Product',
      modelNumber: 'TEST001',
      description: 'Test Description',
      category: 'Limb',
      costPrice: 100,
      sellingPrice: 150,
      stockQuantity: 10,
      lowStockThreshold: 5
    };
    
    console.log('Creating product with data:', productData);
    
    const productResponse = await axios.post('http://localhost:5000/api/products', productData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Product created successfully:', productResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();
