const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/tourapi',
    createProxyMiddleware({
      target: 'http://apis.data.go.kr',
      changeOrigin: true,
      pathRewrite: {
        '^/tourapi': '/B551011/DataLabService', // 이게 핵심
      },
    })
  );

  app.use(
    '/weatherapi',
    createProxyMiddleware({
      target: 'http://apis.data.go.kr',
      changeOrigin: true,
      pathRewrite: {
        '^/weatherapi': '/1360000/VilageFcstInfoService_2.0',
      },
    })
  );
  
  app.use(
    '/tourpreapi',
    createProxyMiddleware({
      target: 'http://apis.data.go.kr',
      changeOrigin: true,
      pathRewrite: {
        '^/tourpreapi': '/B551011/TatsCnctrRateService', // 이게 핵심
      },
    })
  );
};
