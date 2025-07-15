const mapUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    igrpUsername: user.username,
    status: 'ACTIVE',
});
export const mapperUser = (user) => {
    if (!user)
        throw new Error('User not found');
    return mapUser(user);
};
