import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const submitCheckout = async (email, phone, shippingAddress, token = null) => {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await client.post(
    '/checkout',
    {
      email: email,
      phone: phone,
      shipping_address: shippingAddress,
    },
    { headers }
  );
  return response.data;
};
