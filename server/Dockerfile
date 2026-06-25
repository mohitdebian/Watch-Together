FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY ../shared ./shared
RUN npm install
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
