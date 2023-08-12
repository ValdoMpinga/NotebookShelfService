FROM node:20.0.0

WORKDIR  /app

COPY package*.json ./

RUN npm i

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
