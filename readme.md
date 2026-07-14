# Zero

If you are reading this without any prior context, you might be asking:

## What is this project?

This project involves turning my portfolio into a full-blown "personal company" platform by adding OAuth and other features.

## What did I do?
Ive created my own OAuth system with full blown image uploading and etc.
It has all of this features
    - Hackclub Auth
    - 2FA
    - Password managment 
    - Profile picture Managment
    And other tons of features
    It also has like a ton of security like a ton like encryption sha un guessable random stuff etc etc..

## How to use it for yourself
First clone the github repo using:
```cmd
git clone https://github.com/Franco-Senes/Zero.git
```
Then cd to the carpet
```cmd
cd Zero
```
After that cd to the server
```cmd
cd Server
```
Then download the dependencies
```cmd
npm install
```
Then create a .env using this template
```env
PORT=3000
JWT_SECRET=
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
HACKCLUB_CLIENT_ID=
HACKCLUB_CLIENT_SECRET=
HACKCLUB_REDIRECT_URI=http://localhost:3000/api/auth/hackclub/callback
```
After start the server finally
```cmd
npm run dev or npm start
```
If you see this:
```cmd
> zero-backend@1.0.0 dev
> node server.js

◇ injected env (6) from .env // tip: ⌘ override existing { override: true }
Zero.info.bo - Server
Running on http://localhost:3000
Franco was here
------- Debug --------
ignored colum exists
ignored colum exists
ignored colum exists
```
Then you are all buckled up (;

## Thanks for reading (;


