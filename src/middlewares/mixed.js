'use strict';

const mixed = {
    setVariables (req, res, next) {
        res.locals.success = req.flash('success');
        res.locals.error = req.flash('error');
        res.locals.isAuth = req.session.token ? true : false;
        res.locals.documents = req.flash('documents');
        res.locals.polices = req.flash('polices');
        req.headers.authorization = req.session.token ? req.session.token : '';
        return next();
    },

    notFound (req, res, next) {
        return res.status(404).render('errors/notFound');
    }
}

module.exports = mixed;
