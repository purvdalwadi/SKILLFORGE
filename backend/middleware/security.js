const setSecurityHeaders = (req, res, next) => {
    // Add security headers for YouTube iframe embedding
    res.setHeader('Content-Security-Policy', 
        "frame-ancestors 'self' https://www.youtube.com https://youtube.com"
    );
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
};

module.exports = setSecurityHeaders;