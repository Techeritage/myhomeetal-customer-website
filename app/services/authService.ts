import { api } from '@utils/api';
import { apiUtils } from '@utils/apiUtils';

export interface SignupPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string
}

const authService = {
  signup: async (payload?: SignupPayload) => {
    return await apiUtils.postRequest(`${api.SIGNUP}`, payload);
  },
  login: async (payload?: LoginPayload) => {
    return await apiUtils.postRequest(`${api.LOGIN}`, payload);
  },
  forgotPassword: async (payload?: ForgotPasswordPayload) => {
    return await apiUtils.postRequest(`${api.FORGET_PASSWORD}`, payload)
  }
};

export { authService };
