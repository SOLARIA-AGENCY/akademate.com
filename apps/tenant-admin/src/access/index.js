export const isAdmin = ({ req: { user } }) => {
    return user?.role === 'admin';
};
export const isAdminOrGestor = ({ req: { user } }) => {
    return user?.role === 'admin' || user?.role === 'gestor';
};
export const isSelfOrAdmin = ({ req: { user }, id }) => {
    if (user?.role === 'admin')
        return true;
    return user?.id === id;
};
export const isAuthenticated = ({ req: { user } }) => {
    return Boolean(user);
};
//# sourceMappingURL=index.js.map