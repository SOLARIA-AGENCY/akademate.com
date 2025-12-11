import { Access } from 'payload';

export const isAdmin: Access = ({ req: { user } }) => {
  return user?.role === 'admin';
};

export const isAdminOrGestor: Access = ({ req: { user } }) => {
  return user?.role === 'admin' || user?.role === 'gestor';
};

export const isSelfOrAdmin: Access = ({ req: { user }, id }) => {
  if (user?.role === 'admin') return true;
  return user?.id === id;
};

export const isAuthenticated: Access = ({ req: { user } }) => {
  return Boolean(user);
};
