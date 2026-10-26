# Memory Galaxy

Every memory becomes a star.

A private visual diary: create an account, log in to your galaxy, and store memories as interactive stars.

## Run

1. Install and start [MongoDB](https://www.mongodb.com/) locally.
2. From this folder:

```bash
npm install
npm start
```

3. Open [http://localhost:3000](http://localhost:3000)

## Environment

Copy `.env.example` to `.env` if needed:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/memory_galaxy
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
RESET_TOKEN_EXPIRES_MINUTES=30
```

For Gmail reset emails, use an [App Password](https://support.google.com/accounts/answer/185833). If `EMAIL_USER` and `EMAIL_PASSWORD` are empty, the server still creates a 30-minute reset token and logs the link in the terminal.

## Password recovery

- Email reset link (expires in 30 minutes, single use)
- Recovery question chosen at registration

Memories, photos and profile data are private to the signed-in user.
