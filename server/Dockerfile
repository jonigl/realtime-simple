FROM node:10-alpine
WORKDIR /srv
ADD package.json .
RUN npm install
ADD . .
EXPOSE 8080
CMD ["node", "cluster.js"] 
