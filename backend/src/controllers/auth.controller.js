module.exports = {
  me: (req, res) => {
    const { uid, email, perfil, usuario } = req.user;
    res.json({ uid, email, usuario, perfil });
  },
};
