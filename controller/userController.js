const mongoose = require("mongoose");
const User = require("../models/userModel");
const successHandle = require("../service/successHandle");
const appError = require("../service/appError");
// 密碼加解密
const bcrypt = require("bcryptjs");
// 使用者資料驗證
const validator = require("validator");
// JWT 產生與驗證
const jwt = require('jsonwebtoken');

const { generateSendJWT, isAuth } = require("../service/auth");

const userController = {
    async getUser(req, res) {
        const currentUser = await User.findById(req.user._id);
        successHandle(res, currentUser, null);
    },
    async postSignUp(req, res, next) {
        let { name, email, password } = req.body;
        // users collection 裡查無要新增的這筆 user email 時會回傳 null
        const user = await User.findOne({ email }, 'name').exec();
        // 輸入不存在於 users collection 的 email 時回傳 null (才能執行註冊)
        if (user === null) {
            // 加入驗證，確保使用者註冊資料符合格式
            // 這三個欄位為必填
            if (!name || !email || !password) {
                return next(appError(400, '請確保所有欄位皆填寫'));
            };

            // name 長度需至少 2 個字元以上
            if (!(validator.isLength(name, { min: 2 }))) {
                return next(appError(400, '暱稱需至少 2 個字元以上'));
            };

            // 信箱 email 格式正確
            if (!(validator.isEmail(email))) {
                return next(appError(400, '信箱格式不正確'));
            };

            // 密碼 password 長度至少 8 碼以上
            if (!(validator.isLength(password, { min: 8 }))) {
                return next(appError(400, '密碼至少 8 碼以上'));
            };

            // 以上驗證通過，才能將密碼 password 進行加密
            password = await bcrypt.hash(password, 12);

            const newUser = await User.create(
                {
                    name,
                    email,
                    password
                }
            );
            generateSendJWT(newUser, 201, res);
        } else {
            next(appError(400, '該 email 已註冊過!'));
        };
    },
    async postSignIn(req, res, next) {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(appError(400, "帳號或密碼不可為空"));
        }
        // 將前台輸入的 email 值(該欄位為唯一值)去資料庫搜尋且回傳的結果要顯示密碼欄位。查無此 email 會回傳 null
        const user = await User.findOne({ email }).select("+password");

        // 資料庫有該 email 時才能登入，否則跳出請先註冊
        if (user !== null) {
            // 第一個參數是接收到的密碼，第二個參數是由資料庫找出的該 user 的密碼，為雜湊加密的字串
            const auth = await bcrypt.compare(password, user.password);
            if (!auth) {
                return next(appError(400, "帳號或密碼錯誤，請重新輸入！"));
            }
            generateSendJWT(user, 200, res);
        } else {
            next(appError(400, '請先註冊!'));
        };
    },
    async postPassword(req, res, next) {
        const { password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return next(appError("400", "密碼不一致！"));
        };

        // 密碼 password 長度至少 8 碼以上
        if (!(validator.isLength(password, { min: 8 }))) {
            return next(appError(400, '密碼至少 8 碼以上'));
        };

        // 以上驗證通過，才能將密碼 password 進行加密
        newPassword = await bcrypt.hash(password, 12);

        const user = await User.findByIdAndUpdate(req.user.id, {
            password: newPassword
        });

        generateSendJWT(user, 201, res);
    },
    async patchUser(req, res) {
        const { photo, name, sex } = req.body;
        const patchUser = await User.findByIdAndUpdate(req.user._id, {
            photo,
            name,
            sex
        },
            { new: true, runValidators: true }
        );
        successHandle(res, patchUser, null);
    }
};

module.exports = userController;

