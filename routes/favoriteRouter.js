const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../authenticate");
const Favorites = require("../models/favorite");
const cors = require("./cors");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, (req, res, next) => {
        Favorites.find({})
            .populate("user")
            .populate("dishes")
            .then(
                (favorites) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorites);
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .post(
        cors.corsWithOptions,
        authenticate.verifyUser,
        (req, res, next) => {
            Favorites.findOne({ user: req.user._id })
                .then((favorite) => {
                    if (favorite == null) {
                        Favorites.create({ user: req.user._id })
                            .then(
                                (favorite) => {
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    for (const i in req.body) {
                                        favorite.dishes.push(req.body[i]);
                                    }
                                    favorite.save().then((favorite) => {
                                        console.log("favorite Created ", favorite);
                                        res.statusCode = 200;
                                        res.setHeader("Content-Type", "application/json");
                                        res.json(favorite);
                                    });
                                },
                                (err) => next(err)
                            )
                            .catch((err) => next(err));
                    } else {
                        console.log(req.body);
                        for (var dish = 0; dish < req.body.length; dish++) {
                            if (favorite.dishes.indexOf(req.body[dish]) < 0) {
                                favorite.dishes.push(req.body[dish]);
                            }
                        }
                        favorite.save().then((favorite) => {
                            console.log("favorite added ", favorite);
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        });
                    }
                })
                .catch((err) => next(err));
        }
    )
    .put(
        cors.corsWithOptions,
        authenticate.verifyUser,
        authenticate.verifyAdmin,
        (req, res, next) => {
            res.statusCode = 403;
            res.end("PUT operation not supported on /favorites");
        }
    )
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.remove({ user: req.user._id })
            .then(
                (resp) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(resp);
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    });


favoriteRouter
    .route("/:dishId")
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorites) => {
                    if (!favorites) {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        return res.json({ exists: false, favorites: favorites });
                    } else {
                        if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            return res.json({ exists: false, favorites: favorites });
                        } else {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            return res.json({ exists: true, favorites: favorites });
                        }
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id }, (err, favorite) => {
            if (err) {
                return next(err);
            }
            if (!favorite) {
                Favorites.create({ user: req.user._id })
                    .then(
                        (favorite) => {
                            favorite.dishes.push(req.params.dishId);
                            favorite.save().then(
                                (favorite) => {
                                    console.log("favorite Created ", favorite);
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(favorite);
                                },
                                (err) => next(err)
                            );
                        },
                        (err) => next(err)
                    )
                    .catch((err) => next(err));
            } else {
                if (favorite.dishes.indexOf(req.params.dishId) < 0) {
                    favorite.dishes.push(req.params.dishId);
                    favorite.save().then(
                        (favorite) => {
                            console.log("favorite added ", favorite);
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        },
                        (err) => next(err)
                    );
                } else {
                    err = new Error("Dish " + req.params.dishId + " already exist");
                    err.status = 404;
                    return next(err);
                }
            }
        });
    })
    .put(
        cors.corsWithOptions,
        authenticate.verifyUser,
        authenticate.verifyAdmin,
        (req, res, next) => {
            res.statusCode = 403;
            res.end("PUT operation not supported on /favorites");
        }
    )
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorite) => {
                favorite.dishes.remove(req.params.dishId);
                favorite.save().then(
                    (favorite) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(favorite);
                    },
                    (err) => next(err)
                );
            })
            .catch((err) => next(err));
    });
module.exports = favoriteRouter;