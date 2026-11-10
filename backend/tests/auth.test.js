jest.mock('../src/config/firebase', () => ({ getFirebaseAuth: jest.fn() }));
jest.mock('../src/models/Usuario', () => ({ findOne: jest.fn() }));

const { getFirebaseAuth } = require('../src/config/firebase');
const Usuario = require('../src/models/Usuario');
const { autenticar, exigirPerfil } = require('../src/middlewares/auth');

describe('Middleware de autenticação Firebase', () => {
  const identity = { uid: 'firebase-uid', email: 'admin@example.com' };
  const user = { _id: { toString: () => 'mongo-id' }, usuario: 'admin@example.com', perfil: 'ADM' };
  let req;
  let next;
  let verifyIdToken;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: { authorization: 'Bearer firebase-id-token' } };
    next = jest.fn();
    verifyIdToken = jest.fn().mockResolvedValue(identity);
    getFirebaseAuth.mockReturnValue({ verifyIdToken });
    Usuario.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
  });

  test('verifica token e vincula a identidade Firebase ao perfil autorizado', async () => {
    await autenticar(req, {}, next);

    expect(verifyIdToken).toHaveBeenCalledWith('firebase-id-token', true);
    expect(Usuario.findOne).toHaveBeenCalledWith({ firebaseUid: identity.uid });
    expect(req.user).toMatchObject({ uid: identity.uid, email: identity.email, perfil: 'ADM' });
    expect(next).toHaveBeenCalledWith();
  });

  test('rejeita requisições sem bearer token', async () => {
    req.headers.authorization = '';
    await autenticar(req, {}, next);

    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  test('retorna 401 para token Firebase inválido ou revogado', async () => {
    verifyIdToken.mockRejectedValue(Object.assign(new Error('expired'), { code: 'auth/id-token-expired' }));
    await autenticar(req, {}, next);

    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  test('retorna 403 quando o UID não tem perfil no sistema', async () => {
    Usuario.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await autenticar(req, {}, next);

    expect(next.mock.calls[0][0]).toMatchObject({ status: 403 });
  });

  test('exigirPerfil impede ações fora do perfil autorizado', () => {
    req.user = { perfil: 'OPERADOR' };
    exigirPerfil('ADM')(req, {}, next);

    expect(next.mock.calls[0][0]).toMatchObject({ status: 403 });
  });
});
