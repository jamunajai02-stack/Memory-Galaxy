const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { RECOVERY_QUESTIONS, normalizeAnswer } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: 20
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false
    },
    recoveryQuestion: {
      type: String,
      required: [true, 'Recovery question is required'],
      enum: RECOVERY_QUESTIONS
    },
    recoveryAnswer: {
      type: String,
      required: [true, 'Recovery answer is required'],
      select: false
    },
    profileImage: {
      type: String,
      default: ''
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    },
    recoveryFailCount: {
      type: Number,
      default: 0,
      select: false
    },
    recoveryLockUntil: {
      type: Date,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.pre('validate', function normalizePhone() {
  if (!this.phone) this.phone = undefined;
});

userSchema.pre('save', async function hashSecrets() {
  const saltRounds = 12;
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  if (this.isModified('recoveryAnswer')) {
    this.recoveryAnswer = await bcrypt.hash(normalizeAnswer(this.recoveryAnswer), saltRounds);
  }
});

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(String(plain || ''), this.password);
};

userSchema.methods.matchRecoveryAnswer = function matchRecoveryAnswer(plain) {
  return bcrypt.compare(normalizeAnswer(plain), this.recoveryAnswer);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone || '',
    profileImage: this.profileImage || '',
    recoveryQuestion: this.recoveryQuestion,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', userSchema);
