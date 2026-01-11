// backend/routes/user.js
const express = require('express');

const router = express.Router();
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config");
const bcrypt = require("bcrypt");
const { authMiddleware } = require("../middleware");

const signupBody = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string()
})

router.post("/signup", async (req, res) => {
    const { success } = signupBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const existingUser = await User.findOne({
        username: req.body.username
    })

    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken/Incorrect inputs"
        })
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
        username: req.body.username,
        password: hashedPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })
    const userId = user._id;

    await Account.create({
        userId,
        balance: 1 + Math.random() * 10000
    })

    const token = jwt.sign({
        userId
    }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
        message: "User created successfully",
        token: token
    })
})


const signinBody = zod.object({
    username: zod.string().email(),
    password: zod.string()
})

router.post("/signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const user = await User.findOne({
        username: req.body.username
    });

    if (user) {
        // Compare password with bcrypt
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);

        if (!isPasswordValid) {
            return res.status(411).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.json({
            token: token
        })
        return;
    }


    res.status(411).json({
        message: "Error while logging in"
    })
})

const updateBody = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Error while updating information"
        })
    }

    // Don't allow password update through this route
    const { password, ...updateData } = req.body;

    await User.updateOne({ _id: req.userId }, { $set: updateData });

    res.json({
        message: "Updated successfully"
    })
})

// Get current user profile
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching profile"
        });
    }
})

// Change password
const changePasswordBody = zod.object({
    currentPassword: zod.string().min(6),
    newPassword: zod.string().min(6)
})

router.post("/change-password", authMiddleware, async (req, res) => {
    const { success } = changePasswordBody.safeParse(req.body);
    if (!success) {
        return res.status(411).json({
            message: "Invalid input. Password must be at least 6 characters."
        });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(req.body.currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        // Hash and save new password
        const hashedNewPassword = await bcrypt.hash(req.body.newPassword, 10);
        await User.updateOne({ _id: req.userId }, { $set: { password: hashedNewPassword } });

        res.json({
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error changing password"
        });
    }
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports = router;