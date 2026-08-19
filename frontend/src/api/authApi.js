import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerUser = async (firstName, lastName, email) => {
  const response = await client.post('/auth/register', {
    first_name: firstName,
    last_name: lastName,
    email: email,
  });
  return response.data;
};

export const recognizeUser = async (email) => {
  const response = await client.get(`/auth/recognize?email=${encodeURIComponent(email)}`);
  return response.data;
};

export const loginUser = async (email, otp) => {
  const response = await client.post('/auth/login', {
    email: email,
    otp: otp,
  });
  return response.data;
};

export const resendOtpCode = async (email) => {
  const response = await client.post('/auth/resend-otp', {
    email: email,
  });
  return response.data;
};

export const getMe = async (token) => {
  const response = await client.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getUserOrders = async (token) => {
  const response = await client.get('/auth/orders', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

