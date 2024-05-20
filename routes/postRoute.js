const express = require('express');
const router = express.Router();
const PostController = require("../controller/postController");
const handleErrorAsync = require("../service/handleErrorAsync");

router.get('/', function (req, res, next) {
  PostController.getPosts(req, res);
});

// 縮寫
// router.get('/', PostController.getPosts) 

router.post('/', handleErrorAsync(PostController.postPosts));

router.delete('/', function (req, res, next) {
  PostController.deleteAllPosts(req, res, next);
});

router.delete('/:id', handleErrorAsync(PostController.deletePosts));

router.patch('/:id', handleErrorAsync(PostController.patchPosts));

module.exports = router;
