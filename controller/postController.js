const mongoose = require("mongoose");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const successHandle = require("../service/successHandle");
const appError = require("../service/appError");

const postController = {
    async getPosts(req, res) {
        // 排序
        // asc 遞增(由小到大，由舊到新) createdAt ; 
        // desc 遞減(由大到小、由新到舊) "-createdAt"
        const timeSortData = req.query.timeSort === 'asc' ? 'createdAt' : '-createdAt';

        // 關鍵字查詢
        const keywords = req.query.keywords !== undefined ? { "content": new RegExp(req.query.keywords) } : {};

        const allposts = await Post.find(keywords).populate('user').sort(timeSortData);
        successHandle(res, allposts, null);
    },
    async postPosts(req, res, next) {
        const data = req.body;
        // users collection 裡查無要新增的這筆 user id 時會回傳 null
        const postCanDo = await User.findById(data.user, 'name').exec();
        // 輸入非 users collection 的 ID 時回傳 null (無法執行新增)
        if (postCanDo !== null) {
            if (data.content !== undefined && data.content.trim() !== "")
            {
                const newPost = await Post.create(
                    {
                        user: data.user,
                        location: data.location,
                        type: data.type,
                        tags: data.tags,
                        content: data.content.trim(),
                        image: data.image,
                        likes: data.likes
                    }
                );
                successHandle(res, newPost, null);
            } else {
                // 用 appError 自訂錯誤回饋
                next(appError(500, 'content 欄位未確實填寫，或無該筆貼文 id'));
            }
        } else {
            next(appError(400, '查無此用戶 id'));
        }
    },
    // DELETE 刪除單筆資料時，若未填寫 ID 路由為 "/posts/” 時，會刪除所有貼文。用 req.originalUrl 判斷路由是否為 "/posts/” ，是才執行
    async deleteAllPosts(req, res, next) {
        if (req.originalUrl !== "/posts/") {
            await Post.deleteMany();
            successHandle(res, null, '已刪除全部貼文');
        } else {
            next(appError(400, '查無該筆貼文 id'));
        }
    },
    async deletePosts(req, res, next) {
        const id = req.params.id;
        const idResult = await Post.findByIdAndDelete(id);
        // 找到可刪除的會回傳那筆的物件內容。找不到可刪除的則回傳 null
        // console.log(idResult);
        if (idResult !== null) {
            successHandle(res, null, null);

        } else {
            next(appError(400, '查無該筆貼文 id'));
        };
    },
    async patchPosts(req, res, next) {
        const data = req.body;
        // console.log(data);
        const id = req.params.id;
        const idResult = await Post.findById(id);
        // 找到這筆 id 會回傳那筆的物件內容。找不到則回傳 null
        // console.log(idResult);
        if (data.content.trim() !== undefined && idResult !== null && data.content.trim() !== "") {
            // 寫法1
            // await Post.findByIdAndUpdate(
            //     id,
            //     {
            //         name: data.name,
            //         location: data.location,
            //         type: data.type,
            //         tags: data.tags,
            //         content: data.content.trim(),
            //         image: data.image,
            //         likes: data.likes
            //     }
            // );
            // const newPost = await Post.findById(id);

            // 寫法2
            const newPost = await Post.findByIdAndUpdate(
                id,
                {
                    name: data.name,
                    location: data.location,
                    type: data.type,
                    tags: data.tags,
                    content: data.content.trim(),
                    image: data.image,
                    likes: data.likes
                },
                { new: true, runValidators: true }
            );
            successHandle(res, newPost, null);
        } else {
            next(appError(400, '查無該筆貼文內容或 id 屬性'));
        };
    },
};

module.exports = postController;

