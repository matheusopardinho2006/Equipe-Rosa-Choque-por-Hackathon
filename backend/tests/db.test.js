describe('Conexão com o MongoDB', () => {
  function carregarDB({ mongoUri = 'mongodb://127.0.0.1:27017/test', readyState = 0 } = {}) {
    jest.resetModules();

    const connection = {
      readyState,
      host: 'mongodb.test',
      name: 'test',
      on: jest.fn(),
    };
    const connect = jest.fn().mockImplementation(async () => {
      connection.readyState = 1;
    });

    jest.doMock('mongoose', () => ({ connection, connect }));
    jest.doMock('../src/config/env', () => ({ mongoUri }));

    const { connectDB } = require('../src/config/db');
    return { connectDB, connect, connection };
  }

  afterEach(() => {
    jest.dontMock('mongoose');
    jest.dontMock('../src/config/env');
  });

  test('reutiliza a mesma tentativa em chamadas simultâneas', async () => {
    const { connectDB, connect } = carregarDB();

    await Promise.all([connectDB(), connectDB(), connectDB()]);

    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledWith(
      'mongodb://127.0.0.1:27017/test',
      expect.objectContaining({ serverSelectionTimeoutMS: 5000 }),
    );
  });

  test('não abre outra conexão quando o Mongoose já está conectado', async () => {
    const { connectDB, connect, connection } = carregarDB({ readyState: 1 });

    await expect(connectDB()).resolves.toBe(connection);
    expect(connect).not.toHaveBeenCalled();
  });

  test('falha imediatamente quando MONGO_URI não foi configurada', async () => {
    const { connectDB, connect } = carregarDB({ mongoUri: null });

    await expect(connectDB()).rejects.toThrow('MONGO_URI');
    expect(connect).not.toHaveBeenCalled();
  });
});
