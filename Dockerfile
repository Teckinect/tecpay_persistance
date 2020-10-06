FROM node:10

WORKDIR /tecpay_persistance

COPY package.json ./

RUN npm install -g nodemon --no-progress --ignore-optional

RUN npm install --no-progress --ignore-optional

CMD npm run dev