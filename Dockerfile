FROM node:alpine
WORKDIR /Users/hamzaobaid/Desktop/socketApp/DockerFolder
COPY package*.json .
COPY . .
CMD ["npm","start"]