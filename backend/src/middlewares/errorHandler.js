function errorHandler(err, _req, res, _next) {
  // Upload acima do limite ou campo de arquivo errado (multer)
  if (err.name === 'MulterError') {
    const erro = err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo maior que 5 MB' : 'Envie o arquivo no campo "arquivo"';
    return res.status(400).json({ erro });
  }
  const status = err.status || (err.name === 'ValidationError' ? 400 : err.code === 11000 ? 409 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({
    erro: status === 409 && err.code === 11000 ? 'Registro duplicado' : status === 500 ? 'Erro interno' : err.message,
    detalhes: err.details || err.keyValue,
  });
}

module.exports = errorHandler;
