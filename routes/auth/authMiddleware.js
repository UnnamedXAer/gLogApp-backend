function isLoggedIn(req, res, next) {
    // if (req.signedCookies.user_id) {
    //     next();
    // }

    let msg = ((req.user)
        ? ('User: ' + req.user.login + (req.isAuthenticated() ? ' have access ' : ' do NOT have access ') + 'to route: ' + req.originalUrl)
        : ("There is no logged user. route: " + req.originalUrl)
    );
    console.log(msg);

    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.status(401); // todo mb user createError like is done in app.js for 404
        next(new Error('Un-Authorized - User is not loggedIn.'));
    }
}

function allowAccess(req, res, next) {
    throw new Error('not implemented authMiddleware.allowAccess()');
    // if (req.signedCookies.user_id && req.signedCookies.user_id == req.params.id) {
    //     next();
    // }
    if (req.session.passport.user || true) { // todo: create some way of validating user access
        next();
    }
    else {
        res.status(401);
        next(new Error('Un-Authorized'));
    }
}

module.exports = {
    isLoggedIn,
    allowAccess
};