function log( ...msg ) {
    console.log.apply(null, msg)
}

module.exports = function () {
  return async function ( ctx, next ) {
    const start = Date.now();
    log('start time', start);
    await next();
    const ms = Date.now() - start;
    log(`res url ${ctx.url} - ${ms} ms`);
    log(`res data ${ctx.body}`);
  }
}